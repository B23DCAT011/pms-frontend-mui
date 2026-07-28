import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PageHeader from "../components/layout/PageHeader.jsx";
import ProfileSection from "../components/settings/ProfileSection.jsx";
import ChangePasswordSection from "../components/settings/ChangePasswordSection.jsx";
import ChangeEmailSection from "../components/settings/ChangeEmailSection.jsx";
import CommentHistorySection from "../components/settings/CommentHistorySection.jsx";
import TrashSection from "../components/settings/TrashSection.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

export default function SettingsPage() {
  useDocumentTitle("Cài đặt");
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Quản lý hồ sơ, tài khoản và dữ liệu đã xoá." />

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Hồ sơ" />
        <Tab label="Quản lý tài khoản" />
        <Tab label="Lịch sử bình luận" />
        <Tab label="Thùng rác" />
      </Tabs>

      {tab === 0 && <ProfileSection />}
      {tab === 1 && (
        <>
          <ChangePasswordSection />
          <ChangeEmailSection />
        </>
      )}
      {tab === 2 && <CommentHistorySection />}
      {tab === 3 && <TrashSection />}
    </Box>
  );
}
