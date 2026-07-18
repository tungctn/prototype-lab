import HomeClient from "./home-client";

export default function Home() {
  return (
    <HomeClient
      initialWorkspace={{
        learned: false,
        prototype: null,
        tab: "Preview",
      }}
    />
  );
}
