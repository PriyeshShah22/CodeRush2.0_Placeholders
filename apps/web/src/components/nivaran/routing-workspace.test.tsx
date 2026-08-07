import { render,screen } from "@testing-library/react";
import { describe,expect,it } from "vitest";
import { RoutingWorkspace } from "./routing-workspace";
describe("RoutingWorkspace",()=>{it("labels AI output as a recommendation and preserves human accountability",()=>{render(<RoutingWorkspace/>);expect(screen.getByText(/Human review required/i)).toBeInTheDocument();expect(screen.getByText(/AI recommends/i)).toBeInTheDocument();expect(screen.getByText(/Phone number removed/i)).toBeInTheDocument();})});

