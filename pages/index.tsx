export default function Home() {
  return (
    <main
      className="web3bio-container p-4 mt-4 mb-4"
    >
      <div className="container grid-md">
        <h1 className="text-s h2">
          Hello from <strong className="text-bold">Web3.bio Profile APIs</strong>
        </h1>
        <p>The Web3.bio Profile APIs enable developers to easily and quickly integrate Web3 universal profiles from <span className="text-underline">Ethereum (ENS)</span>, <span className="text-underline">Lens Protocol</span>, <span className="text-underline">Farcaster</span>, and <span className="text-underline">Next.ID</span> into their applications. The APIs are already integrated into <a href="https://web3.bio" target="_blank" className="text-underline text-bold">Web3.bio</a> search and profile services.</p>
        <p>This documentation describes the publicly available endpoints of the Web3.bio Profile API, which is a set of RESTful JSON APIs. It explains how to use them and what they return. Currently, the APIs are offered for free to assist developers in getting started with Web3 profiles. We will do our best to maintain uptime.</p>
        <section
          className="pt-2 pb-2"
        >
          <h2 className="text-bold h5">
            Endpoints
          </h2>
          <p>The main public API endpoint URL for Web3.bio Profile APIs is <span className="label">https://api.web3.bio</span>, and the testnet URL is <span className="label">https://api-staging.web3.bio</span>.</p>
          <div className="s-rounded d-flex mt-4 mb-4" style={{"border": "1px solid #ececec", "alignItems": "center"}}>
            <div className="label label-primary m-1 p-2 mr-2">GET</div>
            <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/{"{"}identity{"}"}</div>
          </div>
          <div className="s-rounded d-flex mt-4 mb-4" style={{"border": "1px solid #ececec", "alignItems": "center"}}>
            <div className="label label-primary m-1 p-2 mr-2">GET</div>
            <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/ens/{"{"}identity{"}"}</div>
          </div>
          <div className="s-rounded d-flex mt-4 mb-4" style={{"border": "1px solid #ececec", "alignItems": "center"}}>
            <div className="label label-primary m-1 p-2 mr-2">GET</div>
            <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/lens/{"{"}identity{"}"}</div>
          </div>
          <div className="s-rounded d-flex mt-4 mb-4" style={{"border": "1px solid #ececec", "alignItems": "center"}}>
            <div className="label label-primary m-1 p-2 mr-2">GET</div>
            <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/farcaster/{"{"}identity{"}"}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
