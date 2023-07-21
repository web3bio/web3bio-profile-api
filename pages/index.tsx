export default function Home() {
  const endpointItem = {
          alignItems: "center",
          border: "1px solid #ececec",
          textDecoration: "none",
        },
        endpointLeft = {
          alignItems: "center",
          display: "flex",
          
        },
        endpointRight = {
          marginLeft: "auto",
        }

  return (
    <main
      className="web3bio-container p-4 mt-4 mb-4"
    >
      <div className="container grid-md">
        <h1 className="h2 mt-4 mb-4 pt-4 pb-4">
          Hello from <strong className="text-bold">Web3.bio Profile APIs</strong>
        </h1>
        <div className="web3bio-badge mt-4 mb-4">
          <a
            href="https://web3.bio"
            target="_blank"
            className="btn btn-sm btn-primary pt-4 pb-4"
            title="Web3.bio Web3 Identity Graph Search and Link-in-bio Profile Service"
          >
            <span className="mr-2">👋</span>Made with{" "}
            <strong className="text-pride ml-1 mr-1">Web3.bio</strong>
          </a>
        </div>
        <section className="pt-4 pb-4">
          <p>The Web3.bio Profile APIs enable developers to easily and quickly integrate Web3 universal profiles from <span className="text-underline">Ethereum (ENS)</span>, <span className="text-underline">Lens Protocol</span>, <span className="text-underline">Farcaster</span>, and <span className="text-underline">Next.ID</span> into their applications. These APIs are already integrated into <a href="https://web3.bio" target="_blank" className="text-underline text-bold">Web3.bio</a> search and profile services.</p>
          <p>This documentation describes the publicly available endpoints of the Web3.bio Profile API, which is a set of RESTful JSON APIs. It explains how to use them and what they return. Currently, the APIs are offered for free to assist developers in getting started with Web3 profiles. We will do our best to maintain uptime.</p>
        </section>
        <section className="pt-4 pb-4">
          <h2 className="text-bold h4">
            API Endpoints
          </h2>
          <p>The main public API endpoint domain for Web3.bio Profile APIs is <span className="label">api.web3.bio</span>, and the testnet domain is <span className="label">api-staging.web3.bio</span>.</p>
          <a href="#universal-profile-api" className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/{"{"}identity{"}"}</div>
            </div>
            <div className="mr-2" style={endpointRight}>
              <div className="text-small">
                Retrieve Universal profiles across platforms
                <div className="icon icon-arrow-down ml-2" style={{"fontSize": ".75rem"}}></div>
              </div>
            </div>
          </a>
          <a href="#ens-profile-api" className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/ens/{"{"}identity{"}"}</div>
            </div>
            <div className="mr-2" style={endpointRight}>
              <div className="text-small">
                Retrieve an ENS profile
                <div className="icon icon-arrow-down ml-2" style={{"fontSize": ".75rem"}}></div>
              </div>
            </div>
          </a>
          <a href="#lens-profile-api" className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/lens/{"{"}identity{"}"}</div>
            </div>
            <div className="mr-2" style={endpointRight}>
              <div className="text-">
                Retrieve a Lens profile
                <div className="icon icon-arrow-down ml-2" style={{"fontSize": ".75rem"}}></div>
              </div>
            </div>
          </a>
          <a href="#farcaster-profile-api" className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/farcaster/{"{"}identity{"}"}</div>
            </div>
            <div className="mr-2" style={endpointRight}>
              <div className="text-">
                Retrieve a Farcaster profile
                <div className="icon icon-arrow-down ml-2" style={{"fontSize": ".75rem"}}></div>
              </div>
            </div>
          </a>
        </section>

        <section className="pt-4 pb-4" id="universal-profile-api" style={{"marginTop": "4rem"}}>
          <h2 className="text-bold h5">
            Universal Profile API
          </h2>
          <p>Retrieve Universal profiles across platforms </p>
          <div className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/{"{"}identity{"}"}</div>
            </div>
          </div>
          <h3 className="text-bold h6 mt-4">
            Parameter
          </h3>
          <ul>
            <li><strong>identity <span className="label">string</span></strong> - An Ethereum address, an ENS domain, a Lens handle, a Farcaster username (ends with .farcaster), or a Next.ID address.</li>
          </ul>
          <h3 className="text-bold h6 mt-4">
            Examples
          </h3>
          <ul>
            <li><a href="https://api.web3.bio/profile/0xd8da6bf26964af9d7eed9e03e53415d37aa96045" target="_blank">https://api.web3.bio/profile/0xd8da6bf26964af9d7eed9e03e53415d37aa96045</a></li>
            <li><a href="https://api.web3.bio/profile/vitalik.eth" target="_blank">https://api.web3.bio/profile/vitalik.eth</a></li>
            <li><a href="https://api.web3.bio/profile/stani.lens" target="_blank">https://api.web3.bio/profile/stani.lens</a></li>
            <li><a href="https://api.web3.bio/profile/dwr.farcaster" target="_blank">https://api.web3.bio/profile/dwr.farcaster</a></li>
          </ul>
          <h3 className="text-bold h6 mt-4">
            Responses
          </h3>
          <pre className="code" data-lang="JSON"><code>
            <span className="text-gray">// https://api.web3.bio/profile/vitalik.eth </span><br/>
            &#91;<br/>
            {"    "}&#123;<br/>
            {"        "}"address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",<br/>
            {"        "}"identity": "vitalik.eth",<br/>
            {"        "}"platform": "ENS",<br/>
            {"        "}"displayName": "vitalik.eth",<br/>
            {"        "}"avatar": "https://cdn.simplehash.com/assets/db17eebeede377614b156126590d5e4c521a80fef6bdce78e8e6563b4526b417.gif",<br/>
            {"        "}"email": null,<br/>
            {"        "}"description": null,<br/>
            {"        "}"location": null,<br/>
            {"        "}"header": null,<br/>
            {"        "}"links": &#123;<br/>
            {"        "}{"    "}"website": &#123;<br/>
            {"        "}{"        "}"link": "https://vitalik.ca",<br/>
            {"        "}{"        "}"handle": "vitalik.ca"<br/>
            {"        "}{"    "}&#125;<br/>
            {"        "}&#125;,<br/>
            {"        "}"addresses": &#123;<br/>
            {"        "}{"    "}"eth": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"<br/>
            {"        "}&#125;<br/>
            {"    "}&#125;,<br/>
            {"    "}&#123;<br/>
            {"        "}"address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",<br/>
            {"        "}"identity": "vbuterin",<br/>
            {"        "}"platform": "farcaster",<br/>
            {"        "}"displayName": "Vitalik Buterin",<br/>
            {"        "}"avatar": "https://imgur.com/gF9Yaeg",<br/>
            {"        "}"email": null,<br/>
            {"        "}"description": "hullo",<br/>
            {"        "}"location": null,<br/>
            {"        "}"header": null,<br/>
            {"        "}"links": &#123;<br/>
            {"        "}{"    "}"farcaster": &#123;<br/>
            {"        "}{"        "}"link": "https://warpcast.com/vbuterin",<br/>
            {"        "}{"        "}"handle": "vbuterin"<br/>
            {"        "}{"    "}&#125;<br/>
            {"        "}&#125;,<br/>
            {"        "}"addresses": &#123;<br/>
            {"        "}{"    "}"eth": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"<br/>
            {"        "}&#125;<br/>
            {"    "}&#125;,<br/>
            {"    "}&#123;<br/>
            {"        "}"address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",<br/>
            {"        "}"identity": "vitalik.lens",<br/>
            {"        "}"platform": "lens",<br/>
            {"        "}"displayName": "Vitalik Buterin",<br/>
            {"        "}"avatar": "https://ik.imagekit.io/lens/media-snapshot/d2762e3b5f2532c648feec96bf590923ea6c3783fee428cbb694936ce62962e0.jpg",<br/>
            {"        "}"email": null,<br/>
            {"        "}"description": "Ethereum\n\nFable of the Dragon Tyrant (not mine but it's important): https://www.youtube.com/watch?v=cZYNADOHhVY\n\nAbolish daylight savings time and leap seconds",<br/>
            {"        "}"location": null,<br/>
            {"        "}"header": null,<br/>
            {"        "}"links": &#123;<br/>
            {"        "}{"    "}"lenster": &#123;<br/>
            {"        "}{"        "}"link": "https://lenster.xyz/u/vitalik",<br/>
            {"        "}{"        "}"handle": "vitalik"<br/>
            {"        "}{"    "}&#125;<br/>
            {"        "}&#125;,<br/>
            {"        "}"addresses": &#123;<br/>
            {"        "}{"    "}"matic": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"<br/>
            {"        "}&#125;<br/>
            {"    "}&#125;<br/>
            &#93;<br/>
          </code></pre>
        </section>

        <section className="pt-4 pb-4" id="ens-profile-api" style={{"marginTop": "4rem"}}>
          <h2 className="text-bold h5">
            ENS Profile API
          </h2>
          <p>Retrieve an ENS profile</p>
          <div className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/ens/{"{"}identity{"}"}</div>
            </div>
          </div>
          <h3 className="text-bold h6 mt-4">
            Parameter
          </h3>
          <ul>
            <li><strong>identity <span className="label">string</span></strong> - An Ethereum address or an ENS domain.</li>
          </ul>
          <h3 className="text-bold h6 mt-4">
            Examples
          </h3>
          <ul>
            <li><a href="https://api.web3.bio/profile/ens/0xd8da6bf26964af9d7eed9e03e53415d37aa96045" target="_blank">https://api.web3.bio/profile/ens/0xd8da6bf26964af9d7eed9e03e53415d37aa96045</a></li>
            <li><a href="https://api.web3.bio/profile/ens/vitalik.eth" target="_blank">https://api.web3.bio/profile/ens/vitalik.eth</a></li>
          </ul>
          <h3 className="text-bold h6 mt-4">
            Responses
          </h3>
          <pre className="code" data-lang="JSON"><code>
            <span className="text-gray">// https://api.web3.bio/profile/ens/0xd8da6bf26964af9d7eed9e03e53415d37aa96045 </span><br/>
            <span className="text-gray">// https://api.web3.bio/profile/ens/vitalik.eth </span><br/>
            &#123;<br/>
            {"    "}"address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",<br/>
            {"    "}"identity": "vitalik.eth",<br/>
            {"    "}"platform": "ENS",<br/>
            {"    "}"displayName": "vitalik.eth",<br/>
            {"    "}"avatar": "https://cdn.simplehash.com/assets/db17eebeede377614b156126590d5e4c521a80fef6bdce78e8e6563b4526b417.gif",<br/>
            {"    "}"email": null,<br/>
            {"    "}"description": null,<br/>
            {"    "}"location": null,<br/>
            {"    "}"header": null,<br/>
            {"    "}"links": &#123;<br/>
            {"    "}{"    "}"website": &#123;<br/>
            {"    "}{"        "}"link": "https://vitalik.ca",<br/>
            {"    "}{"        "}"handle": "vitalik.ca"<br/>
            {"    "}{"    "}&#125;<br/>
            {"    "}&#125;,<br/>
            {"    "}"addresses": &#123;<br/>
            {"    "}{"    "}"eth": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"<br/>
            {"    "}&#125;<br/>
            &#125;
          </code></pre>
        </section>

        <section className="pt-4 pb-4" id="lens-profile-api" style={{"marginTop": "4rem"}}>
          <h2 className="text-bold h5">
            Lens Profile API
          </h2>
          <p>Retrieve a Lens profile</p>
          <div className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/lens/{"{"}identity{"}"}</div>
            </div>
          </div>
          <h3 className="text-bold h6 mt-4">
            Parameter
          </h3>
          <ul>
            <li><strong>identity <span className="label">string</span></strong> - An Ethereum/Polygon address or a Lens handle.</li>
          </ul>
          <h3 className="text-bold h6 mt-4">
            Examples
          </h3>
          <ul>
            <li><a href="https://api.web3.bio/profile/lens/0x7241dddec3a6af367882eaf9651b87e1c7549dff" target="_blank">https://api.web3.bio/profile/lens/0x7241dddec3a6af367882eaf9651b87e1c7549dff</a></li>
            <li><a href="https://api.web3.bio/profile/lens/stani.lens" target="_blank">https://api.web3.bio/profile/lens/stani.lens</a></li>
          </ul>
          <pre className="code" data-lang="JSON"><code>
            <span className="text-gray">// https://api.web3.bio/profile/lens/0x7241dddec3a6af367882eaf9651b87e1c7549dff</span><br/>
            <span className="text-gray">// https://api.web3.bio/profile/lens/stani.lens</span><br/>
            &#123;<br/>
            {"    "}"address": "0x7241dddec3a6af367882eaf9651b87e1c7549dff",<br/>
            {"    "}"identity": "stani.lens",<br/>
            {"    "}"platform": "lens",<br/>
            {"    "}"displayName": "stani.lens",<br/>
            {"    "}"avatar": "https://ik.imagekit.io/lens/media-snapshot/e3adfb7046a549480a92c63de2d431f1ced8e516ea285970267c4dc24f941856.png",<br/>
            {"    "}"email": null,<br/>
            {"    "}"description": "Building @LensProtocol & @AaveAave",<br/>
            {"    "}"location": null,<br/>
            {"    "}"header": "https://ik.imagekit.io/lens/media-snapshot/692020434413dd88dd96a93f9df08cfefd0a3b84abba5772c14a2f56ac01b0cd.jpg",<br/>
            {"    "}"links": &#123;<br/>
            {"    "}{"    "}"lenster": &#123;<br/>
            {"    "}{"        "}"link": "https://lenster.xyz/u/stani",<br/>
            {"    "}{"        "}"handle": "stani"<br/>
            {"    "}{"    "}&#125;<br/>
            {"    "}{"    "}"website": &#123;<br/>
            {"    "}{"        "}"link": "https://lens.xyz",<br/>
            {"    "}{"        "}"handle": "lens.xyz"<br/>
            {"    "}{"    "}&#125;<br/>
            {"    "}&#125;,<br/>
            {"    "}"addresses": &#123;<br/>
            {"    "}{"    "}"matic": "0x7241dddec3a6af367882eaf9651b87e1c7549dff"<br/>
            {"    "}&#125;<br/>
            &#125;
          </code></pre>
        </section>

        <section className="pt-4 pb-4" id="farcaster-profile-api" style={{"marginTop": "4rem"}}>
          <h2 className="text-bold h5">
            Farcaster Profile API
          </h2>
          <p>Retrieve a Farcaster profile</p>
          <div className="s-rounded d-flex mt-4 mb-4 p-1" style={endpointItem}>
            <div className="d-flex" style={endpointLeft}>
              <div className="label label-primary p-2 mr-2">GET</div>
              <div className="mr-2"><span className="text-gray">https://api.web3.bio</span>/profile/farcaster/{"{"}identity{"}"}</div>
            </div>
          </div>
          <h3 className="text-bold h6 mt-4">
            Parameter
          </h3>
          <ul>
            <li><strong>identity <span className="label">string</span></strong> - An Ethereum address or a Farcaster username.</li>
          </ul>
          <h3 className="text-bold h6 mt-4">
            Examples
          </h3>
          <ul>
            <li><a href="https://api.web3.bio/profile/farcaster/0xd7029bdea1c17493893aafe29aad69ef892b8ff2" target="_blank">https://api.web3.bio/profile/farcaster/0xd7029bdea1c17493893aafe29aad69ef892b8ff2</a></li>
            <li><a href="https://api.web3.bio/profile/farcaster/dwr" target="_blank">https://api.web3.bio/profile/farcaster/dwr</a></li>
          </ul>
          <pre className="code" data-lang="JSON"><code>
            <span className="text-gray">// https://api.web3.bio/profile/farcaster/0xd7029bdea1c17493893aafe29aad69ef892b8ff2</span><br/>
            <span className="text-gray">// https://api.web3.bio/profile/farcaster/dwr</span><br/>
            &#123;<br/>
            {"    "}"address": "0xd7029bdea1c17493893aafe29aad69ef892b8ff2",<br/>
            {"    "}"identity": "dwr",<br/>
            {"    "}"platform": "farcaster",<br/>
            {"    "}"displayName": "Dan Romero",<br/>
            {"    "}"avatar": "https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_png,w_256/https://lh3.googleusercontent.com/MyUBL0xHzMeBu7DXQAqv0bM9y6s4i4qjnhcXz5fxZKS3gwWgtamxxmxzCJX7m2cuYeGalyseCA2Y6OBKDMR06TWg2uwknnhdkDA1AA",<br/>
            {"    "}"email": null,<br/>
            {"    "}"description": "Working on Farcaster and Warpcast.",<br/>
            {"    "}"location": null,<br/>
            {"    "}"header": null,<br/>
            {"    "}"links": &#123;<br/>
            {"    "}{"    "}"farcaster": &#123;<br/>
            {"    "}{"        "}"link": "https://warpcast.com/dwr",<br/>
            {"    "}{"        "}"handle": "dwr"<br/>
            {"    "}{"    "}&#125;<br/>
            {"    "}&#125;,<br/>
            {"    "}"addresses": &#123;<br/>
            {"    "}{"    "}"eth": "0xd7029bdea1c17493893aafe29aad69ef892b8ff2"<br/>
            {"    "}&#125;<br/>
            &#125;
          </code></pre>
        </section>
      </div>
    </main>
  )
}
