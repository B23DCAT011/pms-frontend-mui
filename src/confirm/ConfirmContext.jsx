import { createContext, useCallback, useContext, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const ConfirmContext = createContext(null);

// Dùng thay window.confirm(): const ok = await confirm("Xoá X?"); if (!ok) return;
export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    setState({
      message,
      title: options.title || "Xác nhận",
      confirmLabel: options.confirmLabel || "Xoá",
      severity: options.severity || "error",
    });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (result) => {
    setState(null);
    resolveRef.current?.(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!state} onClose={() => handleClose(false)}>
        <DialogTitle>{state?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{state?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)}>Huỷ</Button>
          <Button color={state?.severity} variant="contained" onClick={() => handleClose(true)}>
            {state?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
