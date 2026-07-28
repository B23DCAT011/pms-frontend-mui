import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

function StatTile({ label, value, icon, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          bgcolor: (theme) => alpha(theme.palette[color].main, theme.palette.mode === "dark" ? 0.2 : 0.12),
          color: `${color}.main`,
        }}
      >
        {icon}
      </Box>
      <Stack>
        <Typography variant="h4" color={`${color}.main`} fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function StatTiles({ projectCount, taskCount, overdueCount }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile label="Tổng project" value={projectCount} icon={<FolderOpenIcon />} color="primary" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile label="Tổng task" value={taskCount} icon={<AssignmentTurnedInIcon />} color="info" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile
          label="Task quá hạn"
          value={overdueCount}
          icon={<ReportProblemIcon />}
          color={overdueCount > 0 ? "error" : "success"}
        />
      </Grid>
    </Grid>
  );
}
