import { MockGenerationPanel } from "../features/generation/MockGenerationPanel";
import { Mvp0Workspace } from "../features/projects/Mvp0Workspace";
import "./styles.css";
import "./mvp0.css";
import "./mvp1.css";

export function Mvp1App() {
  return (
    <>
      <Mvp0Workspace />
      <MockGenerationPanel />
    </>
  );
}
