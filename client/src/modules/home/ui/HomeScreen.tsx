import { Header } from "./Header";
import { Viewport } from "@/modules/viewport";
import { Toolbar } from "@/modules/toolbar";
import { CharacterPanel } from "@/modules/characters";
import styles from "./HomeScreen.module.css";

export function HomeScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.layout}>
        <Toolbar />
        <main className={styles.gameWindow}>
          <Header />
          <Viewport />
          <div className={styles.statusBar} />
        </main>
        <CharacterPanel />
      </div>
    </div>
  );
}
