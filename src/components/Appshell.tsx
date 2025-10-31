import { AppShell, Group, Burger, ScrollArea, NavLink, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconToolsKitchen2, IconTruckDelivery, IconUsers, IconLogout, IconClipboardData, IconMassage } from '@tabler/icons-react';
import React, { useState } from 'react';
import useHandleLogout from '../modules/auth/handleLogout';

type NavItem = { icon: any; label: string; href: string };

const navData: NavItem[] = [
    { icon: IconMassage, label: "Services", href: "#services" },
    { icon: IconUsers, label: "Users", href: "#users" },
    { icon: IconClipboardData, label: "Reports", href: "#reports" },
];

function Layout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const [active, setActive] = useState(0);
    const { handleLogout } = useHandleLogout();

    const items = navData.map((item, index) => (
        <NavLink
            href={item.href}
            key={item.label}
            active={index === active}
            label={item.label}
            // description={item.description}
            // rightSection={item.rightSection}
            leftSection={<item.icon size={16} stroke={1.5} />}
            onClick={() => setActive(index)}

        />
    ));

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md">
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                    SPAKOL
                </Group>
            </AppShell.Header>
            <AppShell.Navbar>
                <Divider mt="md" mx="md" />
                <AppShell.Section grow my="md" component={ScrollArea} px="md">
                    {items}
                </AppShell.Section>
                <Divider mx="md" />
                <AppShell.Section p="md">
                    <NavLink
                        href='/'
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