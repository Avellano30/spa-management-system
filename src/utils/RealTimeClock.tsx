import { useState, useEffect } from 'react';
import { Text } from '@mantine/core'

function RealTimeClock() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            <Text>{currentTime.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}</Text>
            <Text>{currentTime.toLocaleTimeString()}</Text>
        </div>
    );
}

export default RealTimeClock;
