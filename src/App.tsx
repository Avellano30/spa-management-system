import { Box } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";

export default function App() {
  const { height } = useViewportSize();
    return (
        <>
            <Box className="flex flex-col items-center justify-between" mih={height - 97}>
                Dashboard
            </Box>
        </>
    )
}