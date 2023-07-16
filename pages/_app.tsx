import { AppProps } from "next/app";
import "../styles/web3bio.scss";

/**
 * !STARTERCONF info
 * ? `Layout` component is called in every page using `np` snippets. If you have consistent layout across all page, you can add it here too
 */

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default App;