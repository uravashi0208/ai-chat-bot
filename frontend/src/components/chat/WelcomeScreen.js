import React from "react";
import { Box, Typography } from "@mui/material";
import { LockOutlined as LockIcon } from "@mui/icons-material";

export default function WelcomeScreen() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        bgcolor: "#efeae2",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23d4c9be' opacity='0.5'/%3E%3C/svg%3E")`,
        gap: 2.5,
        px: 4,
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(0,0,0,0.06)",
          mb: 1,
        }}
      >
        <Box sx={{ fontSize: "5rem", lineHeight: 1 }}>💬</Box>
      </Box>

      <Box sx={{ textAlign: "center", maxWidth: 400 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 300, color: "#41525d", mb: 1.5, fontSize: "2rem" }}
        >
          WhatsApp Web
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#667781", lineHeight: 1.8, fontSize: "0.875rem" }}
        >
          Send and receive messages without keeping your phone online.
          <br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </Typography>
      </Box>

      <Box
        sx={{ mt: 1, width: 280, height: "0.5px", bgcolor: "rgba(0,0,0,0.08)" }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <LockIcon sx={{ fontSize: 13, color: "#8696a0" }} />
        <Typography
          variant="caption"
          sx={{ color: "#8696a0", fontWeight: 400 }}
        >
          End-to-end encrypted
        </Typography>
      </Box>
    </Box>
  );
}
