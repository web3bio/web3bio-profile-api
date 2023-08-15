import Head from "next/head";
import Script from "next/script";

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
    };

  return (
    <div>
      <Head>
        <title>Web3.bio Profile APIs - Web3 Universal Profiles</title>
        <meta
          name="description"
          content="The Web3.bio Profile APIs enable developers to easily and quickly integrate Web3 universal profiles from Ethereum (ENS), Lens Protocol, Farcaster, and Next.ID into their applications. "
        />
        <meta property="og:title" content="Web3.bio Profile APIs" />
        <meta
          property="og:description"
          content="The Web3.bio Profile APIs enable developers to easily and quickly integrate Web3 universal profiles from Ethereum (ENS), Lens Protocol, Farcaster, and Next.ID into their applications. "
        />
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          property="og:url"
          content={process.env.NEXT_PUBLIC_PROFILE_END_POINT}
        />
        <meta property="og:site_name" content="Web3.bio" />
        <meta
          property="og:image"
          content="https://web3.bio/img/web3bio-social.jpg"
        />
        <meta property="og:type" content="website" />
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_PROFILE_END_POINT}
        />
        <link 
          rel="shortcut icon"
          href="/favicon.ico" 
        />
      </Head>
      <main className="web3bio-container p-4 mt-4 mb-4">
        <div className="container grid-md">
          <h1 className="h2 mt-4 mb-4 pt-4 pb-4">
            Hello from{" "}
            <strong className="text-bold">Web3.bio Profile APIs</strong>
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
            <p>
              The Web3.bio Profile APIs enable developers to easily and quickly
              integrate Web3 universal profiles from{" "}
              <span className="text-underline">Ethereum (ENS)</span>,{" "}
              <span className="text-underline">Lens Protocol</span>,{" "}
              <span className="text-underline">Farcaster</span>,{" "}
              <span className="text-underline">.bit</span> and{" "}
              <span className="text-underline">Next.ID</span> into their
              applications. These APIs are already integrated into{" "}
              <a
                href="https://web3.bio"
                target="_blank"
                className="text-underline text-bold"
              >
                Web3.bio
              </a>{" "}
              search and profile services.
            </p>
            <p>
              This documentation describes the publicly available endpoints of
              the Web3.bio Profile API, which is a set of RESTful JSON APIs. It
              explains how to use them and what they return. Currently, the APIs
              are offered for free to assist developers in getting started with
              Web3 profiles. We will do our best to maintain uptime.
            </p>
          </section>
          <section className="pt-4 pb-4">
            <h2 className="text-bold h4">API Endpoints</h2>
            <p>
              The main public API endpoint domain for Web3.bio Profile APIs is{" "}
              <span className="label">api.web3.bio</span>, and the testnet
              domain is <span className="label">api-staging.web3.bio</span>.
            </p>
            <a
              href="#universal-profile-api"
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/{"{"}identity{"}"}
                </div>
              </div>
              <div className="mr-2" style={endpointRight}>
                <div className="text-small">
                  Retrieve Universal profiles across platforms
                  <div
                    className="icon icon-arrow-down ml-2"
                    style={{ fontSize: ".75rem" }}
                  ></div>
                </div>
              </div>
            </a>
            <a
              href="#ens-profile-api"
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/ens/{"{"}identity{"}"}
                </div>
              </div>
              <div className="mr-2" style={endpointRight}>
                <div className="text-small">
                  Retrieve an ENS profile
                  <div
                    className="icon icon-arrow-down ml-2"
                    style={{ fontSize: ".75rem" }}
                  ></div>
                </div>
              </div>
            </a>
            <a
              href="#lens-profile-api"
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/lens/{"{"}identity{"}"}
                </div>
              </div>
              <div className="mr-2" style={endpointRight}>
                <div className="text-">
                  Retrieve a Lens profile
                  <div
                    className="icon icon-arrow-down ml-2"
                    style={{ fontSize: ".75rem" }}
                  ></div>
                </div>
              </div>
            </a>
            <a
              href="#farcaster-profile-api"
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/farcaster/{"{"}identity{"}"}
                </div>
              </div>
              <div className="mr-2" style={endpointRight}>
                <div className="text-">
                  Retrieve a Farcaster profile
                  <div
                    className="icon icon-arrow-down ml-2"
                    style={{ fontSize: ".75rem" }}
                  ></div>
                </div>
              </div>
            </a>

            <a
              href="#dotbit-profile-api"
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/dotbit/{"{"}identity{"}"}
                </div>
              </div>
              <div className="mr-2" style={endpointRight}>
                <div className="text-">
                  Retrieve a .bit profile
                  <div
                    className="icon icon-arrow-down ml-2"
                    style={{ fontSize: ".75rem" }}
                  ></div>
                </div>
              </div>
            </a>
          </section>

          <section
            className="pt-4 pb-4"
            id="universal-profile-api"
            style={{ marginTop: "4rem" }}
          >
            <h2 className="text-bold h5">Universal Profile API</h2>
            <p>Retrieve Universal profiles across platforms </p>
            <div
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/{"{"}identity{"}"}
                </div>
              </div>
            </div>
            <h3 className="text-bold h6 mt-4">Parameter</h3>
            <ul>
              <li>
                <strong>identity</strong> <span className="label">string</span>{" "}
                - An Ethereum address, an ENS domain, a Lens handle, a Farcaster
                username (ends with .farcaster), or a Next.ID address.
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Examples</h3>
            <ul>
              <li>
                <span className="label">Ethereum</span>{" "}
                <a
                  href="https://api.web3.bio/profile/0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
                  target="_blank"
                >
                  https://api.web3.bio/profile/0xd8da6bf26964af9d7eed9e03e53415d37aa96045
                </a>
              </li>
              <li>
                <span className="label">ENS</span>{" "}
                <a
                  href="https://api.web3.bio/profile/vitalik.eth"
                  target="_blank"
                >
                  https://api.web3.bio/profile/vitalik.eth
                </a>
              </li>
              <li>
                <span className="label">Lens</span>{" "}
                <a
                  href="https://api.web3.bio/profile/stani.lens"
                  target="_blank"
                >
                  https://api.web3.bio/profile/stani.lens
                </a>
              </li>
              <li>
                <span className="label">Farcaster</span>{" "}
                <a
                  href="https://api.web3.bio/profile/dwr.eth.farcaster"
                  target="_blank"
                >
                  https://api.web3.bio/profile/dwr.eth.farcaster
                </a>
              </li>
              <li>
                <span className="label">Next.ID</span>{" "}
                <a
                  href="https://api.web3.bio/profile/0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50"
                  target="_blank"
                >
                  https://api.web3.bio/profile/0x028f936e528de34fc95179780751ec21256825ce604950580978a8961c5af03e50
                </a>
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Responses</h3>
            <pre className="code" data-lang="JSON">
              <code>
                <span className="text-gray">{`// https://api.web3.bio/profile/0xd8da6bf26964af9d7eed9e03e53415d37aa96045`}</span>
                <br />
                <span className="text-gray">{`// https://api.web3.bio/profile/vitalik.eth`}</span>
                <br />
                {`[
      {
          "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
          "identity": "vitalik.eth",
          "platform": "ENS",
          "displayName": "vitalik.eth",
          "avatar": "https://cdn.simplehash.com/assets/db17eebeede377614b156126590d5e4c521a80fef6bdce78e8e6563b4526b417.gif",
          "email": null,
          "description": null,
          "location": null,
          "header": null,
          "links": {
              "website": {
                  "link": "https://vitalik.ca",
                  "handle": "vitalik.ca"
              }
          },
          "addresses": {
              "eth": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
          }
      },
      {
          "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
          "identity": "vbuterin",
          "platform": "farcaster",
          "displayName": "Vitalik Buterin",
          "avatar": "https://i.imgur.com/gF9Yaeg.jpg",
          "email": null,
          "description": "hullo",
          "location": null,
          "header": null,
          "links": {
              "farcaster": {
                  "link": "https://warpcast.com/vbuterin",
                  "handle": "vbuterin"
              }
          }
      },
      {
          "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
          "identity": "vitalik.lens",
          "platform": "lens",
          "displayName": "Vitalik Buterin",
          "avatar": "https://ik.imagekit.io/lens/media-snapshot/d2762e3b5f2532c648feec96bf590923ea6c3783fee428cbb694936ce62962e0.jpg",
          "email": null,
          "description": "Ethereum  Fable of the Dragon Tyrant (not mine but it's important): https://www.youtube.com/watch?v=cZYNADOHhVY  Abolish daylight savings time and leap seconds",
          "header": "",
          "links": {
              "lenster": {
                  "link": "https://lenster.xyz/u/vitalik",
                  "handle": "vitalik"
              }
          }
      }
  ]`}
              </code>
            </pre>
          </section>

          <section
            className="pt-4 pb-4"
            id="ens-profile-api"
            style={{ marginTop: "4rem" }}
          >
            <h2 className="text-bold h5">ENS Profile API</h2>
            <p>Retrieve an ENS profile</p>
            <div
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/ens/{"{"}identity{"}"}
                </div>
              </div>
            </div>
            <h3 className="text-bold h6 mt-4">Parameter</h3>
            <ul>
              <li>
                <strong>identity</strong> <span className="label">string</span>{" "}
                - An Ethereum address or an ENS domain.
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Examples</h3>
            <ul>
              <li>
                <span className="label">Ethereum</span>{" "}
                <a
                  href="https://api.web3.bio/profile/ens/0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
                  target="_blank"
                >
                  https://api.web3.bio/profile/ens/0xd8da6bf26964af9d7eed9e03e53415d37aa96045
                </a>
              </li>
              <li>
                <span className="label">ENS</span>{" "}
                <a
                  href="https://api.web3.bio/profile/ens/vitalik.eth"
                  target="_blank"
                >
                  https://api.web3.bio/profile/ens/vitalik.eth
                </a>
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Responses</h3>
            <pre className="code" data-lang="JSON">
              <code>
                <span className="text-gray">
                  {`// https://api.web3.bio/profile/ens/0xd8da6bf26964af9d7eed9e03e53415d37aa96045`}{" "}
                </span>
                <br />
                <span className="text-gray">
                  {`// https://api.web3.bio/profile/ens/vitalik.eth`}{" "}
                </span>
                <br />
                {`{
      "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      "identity": "vitalik.eth",
      "platform": "ENS",
      "displayName": "vitalik.eth",
      "avatar": "https://cdn.simplehash.com/assets/db17eebeede377614b156126590d5e4c521a80fef6bdce78e8e6563b4526b417.gif",
      "email": null,
      "description": null,
      "location": null,
      "header": null,
      "links": {
          "website": {
              "link": "https://vitalik.ca",
              "handle": "vitalik.ca"
          }
      },
      "addresses": {
          "eth": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
      }
  }`}
              </code>
            </pre>
          </section>

          <section
            className="pt-4 pb-4"
            id="lens-profile-api"
            style={{ marginTop: "4rem" }}
          >
            <h2 className="text-bold h5">Lens Profile API</h2>
            <p>Retrieve a Lens profile</p>
            <div
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/lens/{"{"}identity{"}"}
                </div>
              </div>
            </div>
            <h3 className="text-bold h6 mt-4">Parameter</h3>
            <ul>
              <li>
                <strong>identity</strong> <span className="label">string</span>{" "}
                - An Ethereum/Polygon address or a Lens handle.
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Examples</h3>
            <ul>
              <li>
                <span className="label">Ethereum / Polygon</span>{" "}
                <a
                  href="https://api.web3.bio/profile/lens/0x7241dddec3a6af367882eaf9651b87e1c7549dff"
                  target="_blank"
                >
                  https://api.web3.bio/profile/lens/0x7241dddec3a6af367882eaf9651b87e1c7549dff
                </a>
              </li>
              <li>
                <span className="label">Lens</span>{" "}
                <a
                  href="https://api.web3.bio/profile/lens/stani.lens"
                  target="_blank"
                >
                  https://api.web3.bio/profile/lens/stani.lens
                </a>
              </li>
            </ul>
            <pre className="code" data-lang="JSON">
              <code>
                <span className="text-gray">{`// https://api.web3.bio/profile/lens/0x7241dddec3a6af367882eaf9651b87e1c7549dff`}</span>
                <br />
                <span className="text-gray">{`// https://api.web3.bio/profile/lens/stani.lens`}</span>
                <br />
                {`{
      "address": "0x7241dddec3a6af367882eaf9651b87e1c7549dff",
      "identity": "stani.lens",
      "platform": "lens",
      "displayName": "Stani",
      "avatar": "https://ik.imagekit.io/lens/media-snapshot/e3adfb7046a549480a92c63de2d431f1ced8e516ea285970267c4dc24f941856.png",
      "email": null,
      "description": "Building @LensProtocol & @AaveAave",
      "header": "https://ik.imagekit.io/lens/media-snapshot/692020434413dd88dd96a93f9df08cfefd0a3b84abba5772c14a2f56ac01b0cd.jpg",
      "links": {
          "lenster": {
              "link": "https://lenster.xyz/u/stani",
              "handle": "stani"
          },
          "website": {
              "link": "https://lens.xyz",
              "handle": "lens.xyz"
          }
      }
  }`}
              </code>
            </pre>
          </section>

          <section
            className="pt-4 pb-4"
            id="farcaster-profile-api"
            style={{ marginTop: "4rem" }}
          >
            <h2 className="text-bold h5">Farcaster Profile API</h2>
            <p>Retrieve a Farcaster profile</p>
            <div
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/farcaster/{"{"}identity{"}"}
                </div>
              </div>
            </div>
            <h3 className="text-bold h6 mt-4">Parameter</h3>
            <ul>
              <li>
                <strong>identity</strong> <span className="label">string</span>{" "}
                - An Ethereum address or a Farcaster username.
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Examples</h3>
            <ul>
              <li>
                <span className="label">Ethereum</span>{" "}
                <a
                  href="https://api.web3.bio/profile/farcaster/0x934b510d4c9103e6a87aef13b816fb080286d649"
                  target="_blank"
                >
                  https://api.web3.bio/profile/farcaster/0x934b510d4c9103e6a87aef13b816fb080286d649
                </a>
              </li>
              <li>
                <span className="label">Farcaster</span>{" "}
                <a
                  href="https://api.web3.bio/profile/farcaster/suji"
                  target="_blank"
                >
                  https://api.web3.bio/profile/farcaster/suji
                </a>
              </li>
            </ul>
            <pre className="code" data-lang="JSON">
              <code>
                <span className="text-gray">{`// https://api.web3.bio/profile/farcaster/0x934b510d4c9103e6a87aef13b816fb080286d649`}</span>
                <br />
                <span className="text-gray">{`// https://api.web3.bio/profile/farcaster/suji`}</span>
                <br />
                {`{
    "address": "0x934b510d4c9103e6a87aef13b816fb080286d649",
    "identity": "suji",
    "platform": "farcaster",
    "displayName": "Suji Yan",
    "avatar": "https://i.seadn.io/gae/ILVYPJ4U951KDc4F2XszloLR0CyAS7odjfr_8GjnrRT-Mdw_BPOMZOou4MStp-imxIIUGoysFZImHAksLQMzcOy1zGIC8T6gxqx-jg?w=500&auto=format",
    "email": null,
    "description": "Mask.io / suji_yan.twitter",
    "location": null,
    "header": null,
    "links": {
        "farcaster": {
            "link": "https://warpcast.com/suji",
            "handle": "suji"
        },
        "twitter": {
            "link": "https://twitter.com/suji_yan",
            "handle": "suji_yan"
        }
    }
}`}
              </code>
            </pre>
          </section>

          <section
            className="pt-4 pb-4"
            id="dotbit-profile-api"
            style={{ marginTop: "4rem" }}
          >
            <h2 className="text-bold h5">.bit Profile API</h2>
            <p>Retrieve a .bit profile</p>
            <div
              className="s-rounded d-flex mt-4 mb-4 p-1"
              style={endpointItem}
            >
              <div className="d-flex" style={endpointLeft}>
                <div className="label label-primary p-2 mr-2">GET</div>
                <div className="mr-2">
                  <span className="text-gray">https://api.web3.bio</span>
                  /profile/dotbit/{"{"}identity{"}"}
                </div>
              </div>
            </div>
            <h3 className="text-bold h6 mt-4">Parameter</h3>
            <ul>
              <li>
                <strong>identity</strong> <span className="label">string</span>{" "}
                - An Ethereum address or a .bit username.
              </li>
            </ul>
            <h3 className="text-bold h6 mt-4">Examples</h3>
            <ul>
              <li>
                <span className="label">Ethereum</span>{" "}
                <a
                  href="https://api.web3.bio/profile/dotbit/0xfa8fa9cf58eaff86aa208366a14d69de87867f1d"
                  target="_blank"
                >
                  https://api.web3.bio/profile/dotbit/0xfa8fa9cf58eaff86aa208366a14d69de87867f1d
                </a>
              </li>
              <li>
                <span className="label">.bit</span>{" "}
                <a
                  href="https://api.web3.bio/profile/dotbit/bestcase.bit"
                  target="_blank"
                >
                  https://api.web3.bio/profile/dotbit/bestcase.bit
                </a>
              </li>
            </ul>
            <pre className="code" data-lang="JSON">
              <code>
                <span className="text-gray">{`// https://api.web3.bio/profile/dotbit/0xfa8fa9cf58eaff86aa208366a14d69de87867f1d`}</span>
                <br />
                <span className="text-gray">{`// https://api.web3.bio/profile/dotbit/bestcase.bit`}</span>
                <br />
                {`{
    "address": "0xfa8fa9cf58eaff86aa208366a14d69de87867f1d",
    "identity": "bestcase.bit",
    "platform": "dotbit",
    "displayName": "bestcase.bit",
    "avatar": "https://uploads-ssl.webflow.com/621ed3ca24af847de76a2dae/635cf43497c26382c70e1c15_bestcase.jpg",
    "description": ".bit is a brand dedicated to assist every single individual and community to unleash their potential and discover more possibilities through the development of self-sovereign identity.   .bit (https://did.id) is also a product which is the only cross-chain unified DID protocol, based on the unique technical architecture, .bit provides services for more than Web3 users. .bit is able to verify signatures by different asymmetric cryptographic algorithms, which allow users to manage and control their .bit accounts with public chain addresses, email addresses, even customized passcodes and biometric data from mobile devices.  .bit determines to build the most practical and applicable suite of infrastructural tools, safeguarding the endowed right of identity sovereignty for each bit of the world.",
    "location": null,
    "header": null,
    "links": {
        "twitter": {
            "handle": "dotbitHQ",
            "link": "https://twitter.com/dotbitHQ"
        },
        "github": {
            "handle": "dotbitHQ",
            "link": "https://github.com/dotbitHQ"
        },
        "discord": {
            "handle": "did",
            "link": "https://discord.com/invite/did"
        },
        "website": {
            "handle": "www.did.id",
            "link": "https://www.did.id/"
        },
        "nostr": {
            "handle": "npub1y0epuwrv23vcue2g5ft8armwdsjfd4dy6frzwmw72y847d3v2ahq7vh2ag",
            "link": "https://snort.social/p/npub1y0epuwrv23vcue2g5ft8armwdsjfd4dy6frzwmw72y847d3v2ahq7vh2ag"
        }
    },
    "addresses": {
        "btc": "3gcu7eghuqanqxun2osmx1bavcvvcsjrrc",
        "doge": "dcuu7pt2dj1u3wzyysvcmwegps3vp81pzj",
        "bsc": "0xfa8fa9cf58eaff86aa208366a14d69de87867f1d",
        "polygon": "0xb2e895579b2ace78e2de99af2d4820e3922b932f",
        "dot": "15w9dugwzz8sqvpzry46j4lrrd8ttdfnx2qqf4arm6jqn2rn",
        "ltc": "lef4g3y8ydpyjurtbdg2zsboxzyxcuqfvf",
        "ckb": "ckb1qzfhdsa4syv599s2s3nfrctwga70g0tu07n9gpnun9ydlngf5vsnwqgrl286nn6catlcd23qsdn2zntfm6rcvlcaq0agl2w0tr40lp42yzpkdg2dd80g0pnlr5whhswq",
        "eth": "0xfa8fa9cf58eaff86aa208366a14d69de87867f1d",
        "trx": "tkxhn9yswcnk2c39lewdne4dcl8xnee2nf"
    }
}`}
              </code>
            </pre>
          </section>
        </div>
      </main>
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-DNMXB1P85W"></script>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-DNMXB1P85W" />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', 'G-DNMXB1P85W');
        `}
      </Script>
    </div>
  );
}
