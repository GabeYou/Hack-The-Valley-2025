"use client";
import Link from "next/link";
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from "@mui/material";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";


export default function Header() {
  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{ backgroundColor: "white", color: "black" }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" , height: 64 }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          disableRipple
          sx={{
            p: 0,
            "&:hover": {
              animation: "rotate-shake 0.5s ease-in-out forwards",
            },
            "@keyframes rotate-shake": {
              "0%": { transform: "rotate(0deg)" },
              "15%": { transform: "rotate(-15deg)" },
              "30%": { transform: "rotate(15deg)" },
              "45%": { transform: "rotate(-10deg)" },
              "60%": { transform: "rotate(10deg)" },
              "75%": { transform: "rotate(-5deg)" },
              "100%": { transform: "rotate(0deg)" },
            },
          }}
        >
          <EnergySavingsLeafIcon
            fontSize="large"
            sx={{ color: "green" }} // Tailwind green-600
          />
        </IconButton>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
          >
            EcoBounty
          </Typography>
        </Box>

        {/* Nav / CTA */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            component={Link}
            href="/signup"
            sx={{
              bgcolor: "#f0fdf4", // green-50
              color: "#16a34a",    // green-600
              border: "1px solid #16a34a",
              "&:hover": {
                bgcolor: "#dcfce7", // green-100 hover
              },
              borderRadius: 1,
              px: 3,
              py: 1,
            }}
          >
            Register
          </Button>

          <Button
            component={Link}
            href="/login"
            sx={{
              bgcolor: "#16a34a", // green-600
              color: "white",
              "&:hover": {
                bgcolor: "#15803d", // green-700
              },
              borderRadius: 1,
              px: 3,
              py: 1,
            }}
          >
            Sign In
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
