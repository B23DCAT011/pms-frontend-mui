import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

function StatTile({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h4" color={color} fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function StatTiles({ projectCount, taskCount, overdueCount }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile label="Tổng project" value={projectCount} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile label="Tổng task" value={taskCount} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile label="Task quá hạn" value={overdueCount} color={overdueCount > 0 ? "error.main" : undefined} />
      </Grid>
    </Grid>
  );
}
