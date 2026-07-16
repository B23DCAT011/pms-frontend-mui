import { useState } from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isOwner = project.created_by_email === user.email;

  const closeMenu = () => setMenuAnchor(null);

  return (
    <Card variant="outlined" sx={{ position: "relative" }}>
      {isOwner && (
        <>
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ position: "absolute", top: 4, right: 4, zIndex: 1 }}
            aria-label="Tuỳ chọn project"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
            <MenuItem
              onClick={() => {
                closeMenu();
                onEdit(project);
              }}
            >
              Sửa
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                onDelete(project);
              }}
            >
              Xoá
            </MenuItem>
          </Menu>
        </>
      )}

      <CardActionArea onClick={() => navigate(`/projects/${project.id}`)}>
        <CardContent>
          <Typography variant="h6" component="h3" noWrap sx={{ pr: isOwner ? 4 : 0 }}>
            {project.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
            {project.description || "Không có mô tả"}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "nowrap", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              Tạo bởi: {project.created_by_email}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              {new Date(project.created_at).toLocaleDateString("vi-VN")}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
