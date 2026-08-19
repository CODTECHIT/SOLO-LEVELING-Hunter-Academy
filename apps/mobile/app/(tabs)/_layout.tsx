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
          backgroundColor: "#070a14",
          borderTopWidth: 1,
          borderTopColor: "rgba(0, 243, 255, 0.2)",
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.neonCyan,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: fonts.sans,
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
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
        name="courses/index"
        options={{
          title: "Courses",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-learning/index"
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

      {/* Hidden nested screens & utility subpages */}
      <Tabs.Screen
        name="courses/[slug]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="my-learning/[courseId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="refunds"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="faq"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="support"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="pricing"
        options={{ href: null }}
      />
    </Tabs>
  );
}
