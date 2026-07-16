import { PieChart } from "@mui/x-charts/PieChart";
import { useTheme } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { DASHBOARD_PANEL_HEIGHT } from "./RecentProjectsList.jsx";

const CATEGORY_LABEL = { todo: "Cần làm", in_progress: "Đang làm", done: "Hoàn thành" };

export default function TaskStatusDonut({ statusCounts }) {
  const theme = useTheme();
  const total = statusCounts.todo + statusCounts.in_progress + statusCounts.done;

  const data = [
    { id: "todo", value: statusCounts.todo, label: CATEGORY_LABEL.todo, color: theme.palette.grey[400] },
    { id: "in_progress", value: statusCounts.in_progress, label: CATEGORY_LABEL.in_progress, color: theme.palette.info.main },
    { id: "done", value: statusCounts.done, label: CATEGORY_LABEL.done, color: theme.palette.success.main },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2, height: DASHBOARD_PANEL_HEIGHT, display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
        Task Status Overview
      </Typography>
      {total === 0 ? (
        <Typography color="text.secondary">Chưa có task nào.</Typography>
      ) : (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
          <PieChart
            series={[
              {
                data,
                innerRadius: 55,
                outerRadius: 90,
                paddingAngle: 2,
                cornerRadius: 4,
              },
            ]}
            height={240}
            slotProps={{
              legend: {
                direction: "row",
                position: { vertical: "bottom", horizontal: "middle" },
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
