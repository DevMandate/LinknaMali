import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  keyframes,
} from "@mui/material";
import {
  CheckCircle,
  Close,
  Extension,
  LocalOffer,
  ExpandMore,
  Star,
} from "@mui/icons-material";
import {
  fetchTiers,
  fetchFeatures,
  fetchAddOns,
  fetchPromotions,
} from "../api/pricing";
import CheckoutPage from "./Checkout";
import { useTheme } from "../../context/Theme";
import { useNavigate } from "react-router-dom";
import AlertDialogue from "../../components/Common/AlertDialogue";

// Color palette
const ACCENT = "#29327E";
const SECONDARY = "#35BEBD";

// Brief descriptions per plan
const briefDescriptions = {
  Starter: "🌱 New or small agents and property owners",
  Growth: "🚀 Active agents with 10–20 listings",
  Max: "👑 Agents and real estate firms (up to 50 listings)",
  Enterprise:
    "🏛️ Large developers or property firms (unlimited listings + tailored visibility)",
};

// Animation for chips
const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
`;

export default function PricingPlans() {
  const [tiers, setTiers] = useState([]);
  const [features, setFeatures] = useState([]);
  const [addons, setAddOns] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTier, setOpenTier] = useState(null);
  const [checkoutTier, setCheckoutTier] = useState(null);

  // Navigation
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAll() {
      try {
        const [tRes, fRes, aRes, pRes] = await Promise.all([
          fetchTiers(),
          fetchFeatures(),
          fetchAddOns(),
          fetchPromotions(),
        ]);
        setTiers(tRes.data.tiers || []);
        setFeatures(fRes.data.tier_features || []);
        setAddOns(aRes.data.addons || []);
        setPromotions(pRes.data.promotions || []);
      } catch (e) {
        console.error(e);
        window.alert("❌ Failed to load pricing data");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Handle Select and Pay
  function handleSelectAndPay(tier) {
    navigate(`/user-dashboard/pricing/checkout/${tier.id}`);
  }

  const getTierFeatures = (id) => {
    const tier = tiers.find((t) => t.id === id) || {};
    const descFeatures = (tier.description || "")
      .split(",")
      .map((s) => s.trim());
    const apiFeatures = features
      .filter((f) => f.tier_id === id)
      .map((f) => `${f.feature_name}${f.value ? `: ${f.value}` : ""}`);
    let merged = [
      ...descFeatures,
      ...apiFeatures.filter((f) => !descFeatures.includes(f)),
    ];
    return merged.map((item) =>
      item.toLowerCase().startsWith("listings included")
        ? `Listings Included: ${
            tier.max_listings > 0 ? tier.max_listings : "Unlimited"
          }`
        : item
    );
  };

  const tierAddOns = (id) => addons.filter((a) => a.tier_id === id);
  const tierPromos = (id) =>
    promotions.filter((p) => p.applies_to_tier_id === id);

  const taglines = useMemo(
    () => [
      "Unlock your full potential with our premium plans!",
      "Best value for businesses of all sizes.",
      "Flexible pricing crafted for your needs.",
    ],
    []
  );
  const [taglineIndex, setTaglineIndex] = useState(0);
  useEffect(() => {
    const iv = setInterval(
      () => setTaglineIndex((i) => (i + 1) % taglines.length),
      4000
    );
    return () => clearInterval(iv);
  }, [taglines.length]);

  const { mostPopularId, popularId } = useMemo(() => {
    if (!tiers.length) return {};
    const sorted = [...tiers].sort((a, b) => b.price - a.price);
    return { mostPopularId: sorted[0].id, popularId: sorted[1]?.id };
  }, [tiers]);

  if (loading)
    return (
      <Box mt={10} textAlign="center">
        <CircularProgress sx={{ color: ACCENT }} />
        <Typography sx={{ color: ACCENT, mt: 1 }}>
          Loading pricing...
        </Typography>
      </Box>
    );

  if (checkoutTier) {
    return (
      <CheckoutPage
        selectedTier={checkoutTier}
        onPaymentSuccess={() => setCheckoutTier(null)}
      />
    );
  }

  return (
    <Box sx={{ pt: 0, p: 4 }}>
      {/* Add AlertDialogue component */}
      <AlertDialogue requestExit={true} />

      <Typography
        variant="h4"
        align="center"
        sx={{ color: ACCENT, fontWeight: "bold" }}
      >
        LinknaMali Premium Plans
      </Typography>
      <Typography
        align="center"
        sx={{ color: ACCENT, mb: 2, fontStyle: "italic" }}
      >
        {taglines[taglineIndex]}
      </Typography>
      <Typography align="center" sx={{ color: "#555", mb: 5 }}>
        1-month free trial. Cancel anytime.
      </Typography>

      <Grid
        container
        spacing={4}
        wrap="nowrap"
        sx={{ overflowX: "auto", pb: 2 }}
      >
        {tiers.map((t) => {
          const feats = getTierFeatures(t.id);
          const promos = tierPromos(t.id);
          const badgeColor =
            t.id === mostPopularId || t.id === popularId ? SECONDARY : null;
          const badgeLabel =
            t.id === mostPopularId
              ? "Most Popular"
              : t.id === popularId
              ? "Popular"
              : null;
          const brief = briefDescriptions[t.name];
          return (
            <Grid
              item
              key={t.id}
              sx={{ flex: "0 0 auto", width: 300, position: "relative" }}
            >
              {badgeLabel && (
                <Chip
                  icon={<Star />}
                  label={badgeLabel}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: badgeColor,
                    color: "#fff",
                  }}
                />
              )}
              <Card
                sx={{
                  background: "#fff",
                  border: `2px solid ${ACCENT}`,
                  borderRadius: 3,
                  transition: "transform 0.3s",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: ACCENT, fontWeight: "bold" }}
                  >
                    {t.name}
                  </Typography>
                  <Typography variant="h3" sx={{ color: ACCENT, my: 1 }}>
                    KES {t.price.toLocaleString()}
                  </Typography>
                  {brief && (
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, color: "#555" }}
                    >
                      {brief}
                    </Typography>
                  )}
                  <Typography sx={{ mb: 1, fontWeight: "bold", color: ACCENT }}>
                    Features:
                  </Typography>
                  <List dense>
                    {feats.slice(0, 3).map((f, i) => (
                      <ListItem
                        key={i}
                        disableGutters
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <ListItemIcon>
                          <CheckCircle sx={{ color: SECONDARY }} />
                        </ListItemIcon>
                        <ListItemText primary={f} />
                      </ListItem>
                    ))}
                    {feats.length > 3 && (
                      <ListItem
                        disableGutters
                        sx={{ cursor: "pointer" }}
                        onClick={() => setOpenTier(t)}
                      >
                        <ListItemIcon>
                          <ExpandMore sx={{ color: ACCENT }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="View More"
                          sx={{ fontStyle: "italic", color: ACCENT }}
                        />
                      </ListItem>
                    )}
                  </List>
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ borderColor: ACCENT, color: ACCENT }}
                      onClick={() => setOpenTier(t)}
                    >
                      Details
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ backgroundColor: SECONDARY }}
                      onClick={() => handleSelectAndPay(t)}
                    >
                      Select & Pay
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 6 }} />
      <Typography
        variant="h5"
        sx={{ color: ACCENT, fontWeight: "bold", mb: 3 }}
      >
        Optional Add-Ons
      </Typography>
      <Grid container spacing={3}>
        {addons.map((a) => (
          <Grid item xs={12} sm={6} md={4} key={a.id}>
            <Card
              sx={{
                background: "#fff",
                border: `1px dashed ${ACCENT}`,
                borderRadius: 2,
                animation: `${popIn} 0.5s`,
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{ color: ACCENT, fontWeight: "bold" }}
                >
                  {a.name}
                </Typography>
                <Typography sx={{ my: 1 }}>{a.description}</Typography>
                <Typography sx={{ fontWeight: "bold", color: ACCENT }}>
                  KES {a.price_min}–{a.price_max}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={6}>
        <Typography variant="body2" sx={{ fontStyle: "italic", color: "#777" }}>
          * Prices are indicative and may vary. Choose the plan that best fits
          your usage and budget.
        </Typography>
      </Box>

      {openTier && (
        <Dialog open fullWidth maxWidth="sm" onClose={() => setOpenTier(null)}>
          <DialogTitle sx={{ backgroundColor: ACCENT, color: "#fff" }}>
            {openTier.name} Plan Details
            <IconButton
              onClick={() => setOpenTier(null)}
              sx={{ position: "absolute", top: 8, right: 8, color: "#fff" }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2, color: ACCENT }}>
              {briefDescriptions[openTier.name] || "Details for this plan."}
            </Typography>
            <Typography sx={{ mb: 2, fontWeight: "bold", color: ACCENT }}>
              Includes:
            </Typography>
            <List dense>
              {getTierFeatures(openTier.id).map((f, i) => (
                <ListItem
                  key={i}
                  disableGutters
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <ListItemIcon>
                    <CheckCircle sx={{ color: SECONDARY }} />
                  </ListItemIcon>
                  <ListItemText primary={f} />
                </ListItem>
              ))}
            </List>
            {tierAddOns(openTier.id).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ mb: 1, fontWeight: "bold", color: ACCENT }}>
                  Add-Ons:
                </Typography>
                <List dense>
                  {tierAddOns(openTier.id).map((a) => (
                    <ListItem key={a.id} disableGutters>
                      <ListItemIcon>
                        <Extension sx={{ color: ACCENT }} />
                      </ListItemIcon>
                      <ListItemText primary={`${a.name}: ${a.description}`} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
            {tierPromos(openTier.id).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ mb: 1, fontWeight: "bold", color: ACCENT }}>
                  Promotions:
                </Typography>
                <List dense>
                  {tierPromos(openTier.id).map((p) => (
                    <ListItem key={p.id} disableGutters>
                      <ListItemIcon>
                        <LocalOffer sx={{ color: ACCENT }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${p.title} (${p.promo_code}): KES ${p.discount}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTier(null)} sx={{ color: ACCENT }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
