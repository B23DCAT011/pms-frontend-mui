import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { searchUsers } from "../../api/users.js";
import { addProjectMember } from "../../api/projects.js";

const ROLE_LABEL = { member: "Member", admin: "Admin" };

export default function AddMemberDialog({ open, onClose, projectId, existingMemberUserIds, onSaved }) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState("member");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    setInputValue("");
    setDebouncedInput("");
    setOptions([]);
    setSelectedUser(null);
    setRole("member");
    setFieldErrors({});
    setSuccessMessage("");
    setFormError("");
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(inputValue), 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    if (!debouncedInput) {
      setOptions([]);
      return;
    }
    let ignore = false;
    setSearching(true);
    searchUsers(debouncedInput)
      .then((data) => {
        if (!ignore) {
          setOptions(data.results.filter((u) => !existingMemberUserIds.includes(u.id)));
        }
      })
      .finally(() => {
        if (!ignore) setSearching(false);
      });
    return () => {
      ignore = true;
    };
  }, [debouncedInput, existingMemberUserIds]);

  const handleClose = () => {
    setFieldErrors({});
    onClose();
  };

  const emailToSubmit = typeof selectedUser === "string" ? selectedUser : selectedUser?.email || inputValue;

  const handleSubmit = () => {
    if (!emailToSubmit) return;

    setSubmitting(true);
    setFieldErrors({});
    setFormError("");

    addProjectMember(projectId, { email: emailToSubmit, role })
      .then((data) => {
        setSuccessMessage(data.detail);
        onSaved();
      })
      .catch((err) => {
        if (err.errors) {
          setFieldErrors(err.errors);
        } else {
          setFormError(err.message || "Thêm thành viên thất bại");
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Thêm thành viên</DialogTitle>
      <DialogContent>
        {successMessage ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            {successMessage}
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Autocomplete
              freeSolo
              options={options}
              loading={searching}
              value={selectedUser}
              onChange={(_, value) => setSelectedUser(value)}
              inputValue={inputValue}
              onInputChange={(_, value) => setInputValue(value)}
              filterOptions={(x) => x}
              getOptionLabel={(option) => (typeof option === "string" ? option : `${option.username} (${option.email})`)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Email hoặc tìm theo username"
                  error={!!fieldErrors.email || !!fieldErrors.non_field_errors}
                  helperText={fieldErrors.email?.[0] || fieldErrors.non_field_errors?.[0]}
                />
              )}
            />
            <TextField select label="Vai trò" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
              {Object.entries(ROLE_LABEL).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {successMessage ? (
          <Button variant="contained" onClick={handleClose}>
            Đóng
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={submitting}>
              Huỷ
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting || !emailToSubmit}>
              Thêm
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
