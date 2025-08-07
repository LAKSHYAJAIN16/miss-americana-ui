import logo from "./assets/logo.png";
import { SpotifyAuth, Scopes } from "react-spotify-auth";

function App() {
  return (
    <main className="bg-[#170416] overflow-hidden text-white w-screen h-screen flex justify-center">
      <meta
        http-equiv="Content-Security-Policy"
        content="
  default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
"
      />
      <div className="flex flex-col items-center justify-center">
        <div className="flex justify-center items-center ">
          <img
            src={logo}
            width={55}
            height={55}
            className="-mt-16 -rotate-12"
          />
          <h1 className="-ml-5 text-center font-bold resize-none text-4xl noto">
            miss americana
          </h1>
        </div>
        <div className="mt-4 ml-5">
          <SpotifyAuth
            redirectUri="http://localhost:1420/home"
            clientID="7f9b0d52c40944878346f258892e14d3"
            scopes={[
              Scopes.userLibraryRead,
              Scopes.userLibraryModify,
              Scopes.userReadPrivate,
              Scopes.userReadEmail,
              Scopes.playlistReadPrivate,
            ]}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
