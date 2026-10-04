import { createRoot } from "react-dom/client";
import { ProgrammingStack } from "./programming-stack";

const mount = document.getElementById("programming-stack");
if (mount) createRoot(mount).render(<ProgrammingStack />);
