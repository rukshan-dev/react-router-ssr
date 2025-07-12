import {
  createContext,
  FC,
  Fragment,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { ClientAssets } from "repacked";

const assetsContext = createContext<Partial<ClientAssets> | null>(null);

export const AssetsProvider: FC<
  PropsWithChildren<{ assets: Partial<ClientAssets> | null }>
> = ({ children, assets }) => {
  return (
    <assetsContext.Provider value={assets}>{children}</assetsContext.Provider>
  );
};

export const Scripts: FC<{ entry?: string; rootUrl?: string }> = ({
  entry = "main",
  rootUrl = "/",
}) => {
  const assets = useContext(assetsContext);

  const universalAssets = useMemo(() => {
    if (assets) {
      return assets;
    }
    if (typeof window !== "undefined" && window.__clientAssets) {
      return window.__clientAssets;
    }
    return {};
  }, [assets]);

  const entryScripts = universalAssets[entry]?.js ?? [];

  return (
    <Fragment>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
          window.__clientAssets = ${JSON.stringify(universalAssets)}
        `,
        }}
      ></script>
      {entryScripts.map((script) => (
        <script
          defer
          key={script}
          suppressHydrationWarning
          src={`${rootUrl}${script}`}
        />
      ))}
    </Fragment>
  );
};

declare global {
  interface Window {
    __clientAssets?: Partial<ClientAssets> | null;
  }
}
