import {
    AppShell,
    Group,
    Burger,
    ScrollArea,
    NavLink,
    Divider,
    Text,
    Stack,
    Box,
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
import type { TablerIcon } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
type NavItem = {
    icon: TablerIcon;
    label: string;
    href: string;
};

const navData: NavItem[] = [
    { icon: IconLayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: IconCalendarWeek, label: "Appointments", href: "/appointments" },
    { icon: IconMassage, label: "Services", href: "/services" },
    { icon: IconUsers, label: "Users", href: "/users" },
    { icon: IconUsers, label: "Employees", href: "/employees" },
    { icon: IconClipboardData, label: "Reports", href: "/reports" },
    { icon: IconLogs, label: "Logs", href: "/logs" },
    { icon: IconSettings, label: "Settings", href: "/settings" },
];

function Layout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const { handleLogout } = useHandleLogout();
    const location = useLocation();
    const [datetime, setDatetime] = useState(dayjs());
    const theme = useMantineTheme();

    useEffect(() => {
        const timer = setInterval(() => {
            setDatetime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const isActive = (href: string) =>
        location.pathname.startsWith(href);

    const NavItem = ({ item }: { item: NavItem }) => {
        const active = isActive(item.href);

        return (
            <NavLink
                href={item.href}
                label={item.label}
                leftSection={<item.icon size={20} stroke={1.7} />}
                active={active}
                onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, "", item.href);
                    window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                styles={{
                    root: {
                        borderRadius: 10,
                        paddingTop: 10,
                        paddingBottom: 10,
                        marginBottom: 4,
                        backgroundColor: active
                            ? theme.colors.blue?.[0]
                            : "transparent",
                        borderLeft: active
                            ? `3px solid ${theme.colors.blue?.[6]}`
                            : "3px solid transparent",
                        transition: "all 120ms ease",
                    },
                    label: {
                        fontSize: 14,
                        fontWeight: 600,
                    },
                }}
            />
        );
    };

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
            padding="md"
        >
            {/* HEADER */}
            <AppShell.Header>
                <Group h="100%" px="sm" justify="space-between">
                    <Group gap="sm">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />

                        <Box>
                            <Text size="sm" c="dimmed">
                                Admin Panel
                            </Text>
                            <Text fw={700} size="md">
                                Spa Management System
                            </Text>
                        </Box>
                    </Group>

                    <ThemeToggle />
                </Group>
            </AppShell.Header>

            {/* SIDEBAR */}
            <AppShell.Navbar p="sm">
                {/* STATUS BLOCK */}
                <Box
                    p="md"
                    style={{
                        borderRadius: 12,
                        background: theme.colors.gray[0],
                    }}
                >
                    <Stack gap={4}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            System Time
                        </Text>

                        <Text fw={700} style={{ fontVariantNumeric: "tabular-nums" }}>
                            {datetime.format("dddd, MMMM D YYYY")}
                        </Text>

                        <Text fw={600} size="sm" c="dimmed">
                            {datetime.format("h:mm:ss A")}
                        </Text>
                    </Stack>
                </Box>

                <Divider my="sm" />

                {/* NAVIGATION */}
                <ScrollArea style={{ flex: 1 }}>
                    <Stack gap={4}>
                        {navData.map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </Stack>
                </ScrollArea>

                <Divider my="sm" />

                {/* FOOTER ACTIONS */}
                <Stack gap="xs">


                    <NavLink
                        label="Sign out"
                        leftSection={<IconLogout size={20} />}
                        onClick={handleLogout}
                        styles={{
                            root: {
                                borderRadius: 10,
                                paddingTop: 10,
                                paddingBottom: 10,
                                color: theme.colors.red[6],
                                transition: "all 120ms ease",
                            },
                            label: { fontSize: 14, fontWeight: 600 },
                        }}
                    />
                </Stack>
            </AppShell.Navbar>

            {/* MAIN */}
            <AppShell.Main>{children}</AppShell.Main>
        </AppShell>
    );
}

export default React.memo(Layout);