import { useState } from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import LinearProgress from "@mui/material/LinearProgress";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { colorFromString } from "../../utils/colorFromString.js";

const ICONS = [BoltIcon, GroupsIcon, EventIcon, SettingsIcon, FolderIcon, AssignmentIcon];

function projectIcon(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const Icon = ICONS[Math.abs(hash) % ICONS.length];
  return <Icon fontSize="small" />;
}

function memberName(m) {
  return [m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.username;
}

export default function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isOwner = project.created_by_email === user.email;
  const accentColor = colorFromString(project.id);

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
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
              bgcolor: (theme) => alpha(accentColor, theme.palette.mode === "dark" ? 0.25 : 0.15),
              color: accentColor,
            }}
          >
            {projectIcon(project.id)}
          </Box>

          <Typography variant="h6" component="h3" noWrap sx={{ pr: isOwner ? 4 : 0 }}>
            {project.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            fontStyle={project.description ? "normal" : "italic"}
            sx={{ mb: 1.5, minHeight: 40 }}
          >
            {project.description || "Không có mô tả"}
          </Typography>

          <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {project.task_count} task
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {project.progress}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={project.progress}
            sx={{
              height: 6,
              borderRadius: 3,
              mb: 1.5,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: accentColor },
            }}
          />

          {project.members.length > 0 && (
            <AvatarGroup
              max={4}
              sx={{ justifyContent: "flex-end", mb: 1, "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 12 } }}
            >
              {project.members.map((m) => (
                <Avatar key={m.id} sx={{ bgcolor: colorFromString(m.user.id) }} title={memberName(m)}>
                  {memberName(m).charAt(0).toUpperCase()}
                </Avatar>
              ))}
            </AvatarGroup>
          )}

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
