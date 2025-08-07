import React, { useEffect, useState } from "react";
import { Box, Typography, Grid } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import axios from "axios";
import { Link } from "react-router-dom"; // ✅ added

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios
      .get("https://api.linknamali.ke/projects/getallprojects")
      .then((res) => {
        setProjects(res.data.projects || []);
      })
      .catch((err) => console.error("❌ Failed to fetch projects:", err));
  }, []);

  return (
    <Box sx={{ padding: "2rem" }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        align="center"
        sx={{ color: "#29327E" }}
      >
        Featured Ongoing Projects
      </Typography>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Link
              to={`/projects/${project.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  overflow: "hidden",
                  boxShadow: 1,
                  bgcolor: "var(--hamburger, #fff)",
                  borderRadius: 1,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                {project.cover_image?.image_url ? (
                  <Box
                    component="img"
                    src={project.cover_image.image_url}
                    alt={project.name}
                    sx={{ width: "100%", height: "200px", objectFit: "cover" }}
                  />
                ) : (
                  <Typography
                    sx={{
                      width: "100%",
                      height: "200px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    No Image available
                  </Typography>
                )}

                <Box sx={{ pt: 1, px: 1 }}>
                  <Typography variant="subtitle1" gutterBottom noWrap>
                    {project.name}, {project.location}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <LocationOnIcon
                      sx={{ fontSize: 18, mr: 0.5, color: "#00b894" }}
                    />
                    <Typography variant="caption">
                      {project.location}
                    </Typography>
                  </Box>

                  <Box component="br" my={1} borderColor="#ccc" />

                  <Typography variant="body2" sx={{ px: 1 }}>
                    {project.description}
                  </Typography>
                </Box>
              </Box>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProjectsPage;
