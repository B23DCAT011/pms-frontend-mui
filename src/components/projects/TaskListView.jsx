import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "../../constants/taskPriority.js";

export default function TaskListView({ tasks }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Assignee</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>{task.title}</TableCell>
              <TableCell>{task.status.name}</TableCell>
              <TableCell>
                <Chip
                  label={PRIORITY_LABEL[task.priority]}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: (theme) => alpha(theme.palette[PRIORITY_COLOR[task.priority]].main, 0.15),
                    color: `${PRIORITY_COLOR[task.priority]}.dark`,
                  }}
                />
              </TableCell>
              <TableCell>{task.deadline ? new Date(task.deadline).toLocaleDateString("vi-VN") : "—"}</TableCell>
              <TableCell>{task.assigned_to?.first_name || task.assigned_to?.username || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
