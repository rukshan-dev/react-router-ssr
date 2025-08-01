import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export default (source: string) => {
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const errors: string[] = [];
  const error = (message: string) => {
    errors.push(message);
  };

  const namedExports: string[] = [];
  const validVariableDeclarations: string[] = [];
  let ignoreTransform = false;

  traverse(ast, {
    Program: ({ node }) => {
      const body = node.body;
      const hasUseServerDirective = node.directives.some(
        (directive) => directive.value.value.toLowerCase() === "use server"
      );
      //early return if `use server` directive not found.
      if (!hasUseServerDirective) {
        ignoreTransform = true;
        return;
      }
      const handleVariableDeclaration = (node: t.VariableDeclaration) => {
        if (t.isVariableDeclaration(node)) {
          if (node.declarations.length > 0) {
            const declaration = node.declarations[0];
            if (
              t.isFunctionExpression(declaration.init) ||
              t.isArrowFunctionExpression(declaration.init)
            ) {
              //@ts-ignore , @todo: fix ts error in next phase
              validVariableDeclarations.push({
                //@ts-ignore , @todo: fix ts error in next phase
                name: declaration.id.name,
                type: declaration.init.type,
              });
            }
          }
        }
      };

      const handleExportNamedDeclaration = (node: t.ExportNamedDeclaration) => {
        if (t.isExportNamedDeclaration(node)) {
          //handle `export const a = () => {}`
          if (t.isVariableDeclaration(node.declaration)) {
            if (
              node.declaration.declarations &&
              node.declaration.declarations.length > 0 &&
              t.isVariableDeclarator(node.declaration.declarations[0])
            ) {
              switch (node.declaration.declarations[0].init?.type) {
                case "ArrowFunctionExpression":
                case "FunctionExpression":
                  //@ts-ignore , @todo: fix ts error in next phase
                  namedExports.push(node.declaration.declarations[0].id.name);
                  break;
                default:
                  error(
                    //@ts-ignore , @todo: fix ts error in next phase
                    `cannot export ${node.declaration.declarations[0].init.type} from server functions.`
                  );
              }
            }
          }
          //handle `export {name}`
          if (node.specifiers) {
            node.specifiers.forEach((specifier) => {
              if (t.isExportSpecifier(specifier)) {
                const allowedExport = validVariableDeclarations.find(
                  //@ts-ignore , @todo: fix ts error in next phase
                  (declaration) => declaration.name === specifier.exported.name
                );
                if (!allowedExport) {
                  error(
                    //@ts-ignore , @todo: fix ts error in next phase
                    `unable to export declaration ${specifier.exported.name} from server function.`
                  );
                } else {
                  //@ts-ignore , @todo: fix ts error in next phase
                  namedExports.push(specifier.exported.name);
                }
              }
            });
          }
        }
      };

      const handleExportDefault = (node: t.ExportDefaultDeclaration) => {
        if (t.isExportDefaultDeclaration(node)) {
          if (
            t.isArrowFunctionExpression(node.declaration) ||
            t.isFunctionExpression(node.declaration)
          ) {
            namedExports.push("default");
            return;
          }
        }
        if (t.isIdentifier(node.declaration)) {
          const allowedExport = validVariableDeclarations.find(
            //@ts-ignore , @todo: fix ts error in next phase
            (declaration) => declaration.name === node.declaration.name
          );
          if (allowedExport) {
            namedExports.push("default");
            return;
          }
          error(
            `unable to export default declaration ${node.declaration.name} from server function.`
          );
        }
      };

      for (const node of body) {
        switch (node.type) {
          case "ExportDefaultDeclaration":
            handleExportDefault(node);
            break;
          case "ExportNamedDeclaration":
            handleExportNamedDeclaration(node);
            break;
          case "VariableDeclaration":
            handleVariableDeclaration(node);
            break;
        }
      }
    },
  });

  if (ignoreTransform) {
    return source;
  }

  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  return `

  const jsonToResponse = async (
    json
  ) => {
    return new Response(json.body, {
      status: json.status,
      statusText: json.statusText,
      headers: json.headers,
    });
  };

  const __internal__custom__server_fn = async ({request}) => {
  const method = request.method;
  console.debug('loading data from server')
  const url = new URL(request.url);
  const res = await fetch(url, {
    method,
    body: method.toLowerCase() !== "get" ? new URLSearchParams(await request.formData()) : undefined,
    headers: {
      "Content-Type": method.toLowerCase() !== "get" ? "application/x-www-form-urlencoded": "application/json",
      Accept: "application/json",
    },
  });
  const serializedResponse = res.headers.get('x-serialized-response');
  if(serializedResponse){
  const json = await res.json();
  return jsonToResponse(json);
  }
  return res.json();
  }
  ${namedExports
    .map((exportVariable) => {
      if (exportVariable === "default") {
        return `export default __internal__custom__server_fn;`;
      }
      return `export const ${exportVariable} = __internal__custom__server_fn;`;
    })
    .join("\n")}
  `;
};
