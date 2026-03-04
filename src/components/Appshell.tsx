import {
  AppShell,
  Group,
  Burger,
  ScrollArea,
  NavLink,
  Divider,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconUsers,
  IconLogout,
  IconMassage,
  IconSettings,
  IconLayoutDashboard,
  IconCalendarWeek,
  IconClipboardData,
  IconLogs,
} from "@tabler/icons-react";
import React from "react";
import ThemeToggle from "./ThemeToggle";
import useHandleLogout from "../modules/auth/handleLogout";
import { useLocation } from "react-router";
import RealTimeClock from "../utils/RealTimeClock.tsx";

type NavItem = { icon: any; label: string; href: string };

const navData: NavItem[] = [
  { icon: IconLayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: IconCalendarWeek, label: "Appointments", href: "/appointments" },
  { icon: IconMassage, label: "Services", href: "/services" },
  { icon: IconUsers, label: "Users", href: "/users" },
  { icon: IconClipboardData, label: "Reports", href: "/reports" },
  { icon: IconLogs, label: "Logs", href: "/logs" },
  { icon: IconSettings, label: "Settings", href: "/settings" },
];

function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const { handleLogout } = useHandleLogout();
  const location = useLocation();
  const datetime = RealTimeClock();
  const items = navData.map((item) => (
    <NavLink
      href={item.href}
      key={item.label}
      active={location.pathname.startsWith(item.href)}
      label={item.label}
      leftSection={<item.icon size={16} stroke={1.5} />}
    />
  ));

  const theme = useMantineTheme();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        sx={(t) => ({
          backgroundColor:
            t.colorScheme === "dark" ? t.colors.dark[7] : t.colors.gray[0],
        })}
      >
        <Group h="100%" px="md" style={{ width: "100%", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color={theme.colorScheme === "dark" ? "white" : "black"}
            />
            <span
              style={{
                marginLeft: 8,
                fontWeight: 500,
                color: theme.colorScheme === "dark" ? "#fff" : "#111",
              }}
            >
              Spa Management System
            </span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle />
          </div>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <AppShell.Section mt="md" mx="md">
          {datetime}
        </AppShell.Section>
        <Divider mt="md" mx="md" />
        <AppShell.Section grow my="md" component={ScrollArea} px="md">
          {items}
        </AppShell.Section>
        <Divider mx="md" />
        <AppShell.Section p="md">
          <NavLink
            href="/"
            label="Sign out"
            leftSection={<IconLogout size={16} stroke={1.5} />}
            onClick={handleLogout}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default React.memo(Layout);
