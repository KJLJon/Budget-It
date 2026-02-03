import { useEffect, useState } from 'react';

export function ChartTooltip(props: any) {
  const { active, payload, label, formatter, labelFormatter } = props;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const bgColor = isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)';
  const textColor = isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        color: textColor,
      }}
    >
      {label && (
        <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry: any, index: number) => {
        const [formattedValue, formattedName] = formatter
          ? formatter(entry.value, entry.name, entry)
          : [entry.value, entry.name];

        return (
          <p key={index} style={{ fontSize: '0.875rem', marginBottom: index < payload.length - 1 ? '0.25rem' : 0 }}>
            <span style={{ color: entry.color || textColor }}>●</span>{' '}
            <span>{formattedName}:</span>{' '}
            <span style={{ fontWeight: 600 }}>{formattedValue}</span>
          </p>
        );
      })}
    </div>
  );
}
