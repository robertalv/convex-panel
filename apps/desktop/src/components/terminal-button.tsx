import { useTerminalActions } from "@/contexts/terminal-context";
import { useTerminalState } from "@/contexts/terminal-context";
import { IconButton } from "./ui/button";
import { Icon } from "./ui/icon";

interface TerminalButtonProps {
    onOpenSettings?: () => void;
}

export function TerminalButton({ onOpenSettings: _onOpenSettings }: TerminalButtonProps) {
    const { toggleTerminal } = useTerminalActions();
    const { isOpen } = useTerminalState();
  
    const handleClick = async () => {
      toggleTerminal();
    };
  
    const title = isOpen ? "Close terminal (⌃`)" : "Open terminal (⌃`)";
  
    return (
      <IconButton
        type="button"
        onClick={handleClick}
        variant="topbar"
        tooltip={title}
        active={isOpen}
        size="sm"
      >
        <Icon name="terminal" className="h-4 w-4" />
      </IconButton>
    );
  }