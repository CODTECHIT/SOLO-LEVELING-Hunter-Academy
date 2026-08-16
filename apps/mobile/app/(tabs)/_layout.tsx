import { Tabs } from "expo-router";
import { colors, fonts } from "@/theme";
import {
  Home,
  BookOpen,
  GraduationCap,
  User,
} from "lucide-react-native";

console.log("Layout Imports:", { Tabs: !!Tabs, Home: !!Home });

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.neonPurple,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: fonts.sans,
          fontSize: 11,
          letterSpacing: 0.5,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-learning"
        options={{
          title: "My Learning",
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{ href: null, title: "Purchases" }}
      />
      <Tabs.Screen
        name="refunds"
        options={{ href: null, title: "Refunds" }}
      />
      <Tabs.Screen
        name="faq"
        options={{ href: null, title: "FAQ" }}
      />
      <Tabs.Screen
        name="support"
        options={{ href: null, title: "Support" }}
      />
      <Tabs.Screen
        name="pricing"
        options={{ href: null, title: "Pricing" }}
      />
    </Tabs>
  );
}
