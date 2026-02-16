import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.titleBar}>
      <h1 className={styles.title}>VWORLD</h1>
    </header>
  );
}
