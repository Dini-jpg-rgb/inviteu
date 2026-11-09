"use client";

import React from "react";
import { Typography } from "antd";
import styles from "../../designer-workspace.module.css";

const { Title, Text } = Typography;

interface DesignerPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DesignerPageHeader({
  title,
  description,
  actions,
}: DesignerPageHeaderProps) {
  return (
    <div className={`${styles.pageHeader} flex flex-col sm:flex-row`}>
      <div>
        <Title level={2} className={styles.pageHeaderTitle}>
          {title}
        </Title>
        {description && <Text type="secondary">{description}</Text>}
      </div>
      {actions && <div className={`${styles.pageHeaderActions} flex sm:shrink-0`}>{actions}</div>}
    </div>
  );
}
