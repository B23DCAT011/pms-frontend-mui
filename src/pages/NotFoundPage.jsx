import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import logo from "../assets/kiai-logo.png";

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
      <Paper variant="outlined" sx={{ p: 4, width: 360, textAlign: "center" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <img src={logo} alt="KIAI" style={{ height: 40 }} />
        </Box>

        <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h6" gutterBottom>
          Không tìm thấy trang
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị chuyển đi.
        </Typography>

        <Button component={RouterLink} to="/" variant="contained">
          Về trang chủ
        </Button>
      </Paper>
    </Box>
  );
}
