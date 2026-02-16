import styles from "./Toolbar.module.css";

const buttons = ["Button 1", "Button 2", "Button 3", "Button 4"];

export function Toolbar() {
  return (
    <aside className={styles.toolbar}>
      <h2 className={styles.title}>SETTINGS</h2>
      {buttons.map((label) => (
        <button key={label} className={styles.btn} disabled>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </aside>
  );
}
