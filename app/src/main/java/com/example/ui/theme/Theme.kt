package com.example.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val BrandBlack = Color(0xFF0A0A0A)
val BrandPureWhite = Color(0xFFFFFFFF)
val BrandSurface = Color(0xFFF8FAFC)
val BrandSurfaceVariant = Color(0xFFF1F5F9)
val BrandBorder = Color(0xFFE2E8F0)
val BrandMutedText = Color(0xFF64748B)
val BrandEmerald = Color(0xFF059669)
val BrandEmeraldContainer = Color(0xFFECFDF5)
val BrandAmber = Color(0xFFD97706)
val BrandAmberContainer = Color(0xFFFFFBEB)
val BrandRose = Color(0xFFDC2626)
val BrandRoseContainer = Color(0xFFFEF2F2)
val BrandIndigo = Color(0xFF4F46E5)
val BrandIndigoContainer = Color(0xFFEEF2FF)

private val MPartnerColorScheme = lightColorScheme(
    primary = BrandBlack,
    onPrimary = BrandPureWhite,
    primaryContainer = BrandSurfaceVariant,
    onPrimaryContainer = BrandBlack,
    secondary = BrandEmerald,
    onSecondary = BrandPureWhite,
    secondaryContainer = BrandEmeraldContainer,
    onSecondaryContainer = Color(0xFF065F46),
    tertiary = BrandIndigo,
    onTertiary = BrandPureWhite,
    tertiaryContainer = BrandIndigoContainer,
    onTertiaryContainer = Color(0xFF312E81),
    background = BrandPureWhite,
    onBackground = BrandBlack,
    surface = BrandPureWhite,
    onSurface = BrandBlack,
    surfaceVariant = BrandSurface,
    onSurfaceVariant = BrandMutedText,
    outline = BrandBorder,
    outlineVariant = Color(0xFFCBD5E1),
    error = BrandRose,
    onError = BrandPureWhite,
    errorContainer = BrandRoseContainer,
    onErrorContainer = Color(0xFF991B1B)
)

private val MPartnerTypography = Typography(
    headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.ExtraBold, fontSize = 28.sp, lineHeight = 34.sp, letterSpacing = (-0.5).sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 28.sp, letterSpacing = (-0.3).sp),
    titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 18.sp, lineHeight = 24.sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, lineHeight = 20.sp),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 15.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 13.sp, lineHeight = 19.sp),
    bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 13.sp, lineHeight = 18.sp),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 11.sp, lineHeight = 14.sp)
)

private val MPartnerShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun MPartnerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MPartnerColorScheme,
        typography = MPartnerTypography,
        shapes = MPartnerShapes,
        content = content
    )
}
