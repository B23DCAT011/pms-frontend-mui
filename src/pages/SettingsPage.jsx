import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ProfileSection from "../components/settings/ProfileSection.jsx";
import CommentHistorySection from "../components/settings/CommentHistorySection.jsx";
import TrashSection from "../components/settings/TrashSection.jsx";

export default function SettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Hồ sơ" />
        <Tab label="Lịch sử bình luận" />
        <Tab label="Thùng rác" />
      </Tabs>

      {tab === 0 && <ProfileSection />}
      {tab === 1 && <CommentHistorySection />}
      {tab === 2 && <TrashSection />}
    </Box>
  );
}
