import { AppShell, Burger, Group, Image, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLogout, IconTruckDelivery, IconUsers, IconToolsKitchen2 } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

const navData = [
    { icon: IconToolsKitchen2, label: "Menu", href: "/products" },
    { icon: IconTruckDelivery, label: "Deliveries", href: "/orders" },
    { icon: IconUsers, label: "Users", href: "/users" },
    { icon: IconLogout, label: "Sign out", href: "/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const currentIndex = Number(localStorage.getItem("index")) || 0;
    const navigate = useNavigate();

    const items = navData.map((item, index) => (
        <UnstyledButton
            key={item.label}
            onClick={() => { 
                localStorage.setItem("index", String(index));
                toggle();
                navigate(item.href);
            }}
            style={{ display: 'flex', alignItems: 'center', padding:"8px", background: index === currentIndex ? '#DEE2E6' : 'inherit', fontWeight: 500, borderRadius: 10, marginBottom: 5 }}
        >
            <item.icon size="1.5rem" stroke={1.5} style={{ marginRight: 5 }} />
            {item.label}
        </UnstyledButton>
    ));

    return (
        <AppShell
            layout="alt"
            header={{ height: 75 }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Image src={'Logo'} h={74} w={100}/>
                        <Text fw={600}>SPAKOL</Text>
                    </Group>
                    <Group>
                        {items}
                    </Group>
                </Group>
            </AppShell.Header>
            <AppShell.Main style={{ display: 'flex', alignItems: 'center', flexDirection:"column"}}>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}