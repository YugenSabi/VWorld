import styles from "./Toolbar.module.css";

const buttons = ["BUTTON 1", "BUTTON 2", "BUTTON 3", "BUTTON 4"];

export function Toolbar() {
  return (
    <aside className={styles.toolbar}>
      {buttons.map((label) => (
        <button key={label} className={styles.btn} disabled>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </aside>
  );
}
