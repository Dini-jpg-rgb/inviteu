"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppstoreOutlined,
  DownOutlined,
  FileImageOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Avatar,
  Breadcrumb,
  Button,
  ConfigProvider,
  Dropdown,
  Drawer,
  Layout,
  Menu,
  Space,
  Tooltip,
  Typography,
} from "antd";
import idID from "antd/locale/id_ID";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { useAuth } from "@/context/AuthContext";
import { DesignerTemplatesProvider } from "./designer/DesignerTemplatesContext";
import styles from "./designer-workspace.module.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);

  const navigationItems = [
    { key: "/designer/dashboard", icon: <AppstoreOutlined />, label: "Dashboard" },
    {
      key: "/designer/templates",
      icon: <FileImageOutlined />,
      label: "Template Management",
    },
  ];
  const selectedKey = pathname.startsWith("/designer/templates")
    ? "/designer/templates"
    : pathname.startsWith("/designer/profile")
      ? "/designer/profile"
      : "/designer/dashboard";
  const breadcrumbTitle =
    selectedKey === "/designer/templates"
      ? pathname === "/designer/templates"
        ? "Template Management"
        : "Template Preview"
      : selectedKey === "/designer/profile"
        ? "Profile"
        : "Dashboard";
  const navigate = (key: string) => {
    router.push(key);
    setIsMobileMenuOpen(false);
  };
  const navigationMenu = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={navigationItems}
      onClick={({ key }) => navigate(key)}
      className={styles.navigationMenu}
    />
  );
  const profileMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Profil Designer",
        onClick: () => navigate("/designer/profile"),
      },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        danger: true,
        onClick: () => {
          setIsMobileMenuOpen(false);
          void logout();
        },
      },
    ],
    className: styles.accountDropdownMenu,
  };
  const sidebarNavigation = (
    <div className={styles.sidebarNavigation}>
      <div className={styles.mainNavigation}>
        <div className={styles.sidebarBrand}>
          <Avatar shape="square" className="!bg-[#FCB040] !font-semibold !text-[#3A2313]">
            IU
          </Avatar>
          <div className="flex flex-col leading-tight">
            <Text strong className="!text-[14px]">
              InviteU Studio
            </Text>
            <Text type="secondary" className="!text-xs">
              Designer Workspace
            </Text>
          </div>
        </div>
        <div className={styles.primaryNavigation}>
          <Text className={styles.navigationLabel}>Menu Utama</Text>
          {navigationMenu}
        </div>
      </div>
      <div className={styles.accountNavigation}>
        <Text className={styles.navigationLabel}>Menu Akun</Text>
        <Dropdown
          menu={profileMenu}
          trigger={["click"]}
          placement="topRight"
          autoAdjustOverflow
          className={styles.accountDropdown}
        >
          <Button
            type="text"
            className={`${styles.profileTrigger} ${selectedKey === "/designer/profile" ? styles.profileTriggerActive : ""}`}
            aria-haspopup="menu"
          >
            <UserOutlined />
            <span>Profile</span>
            <DownOutlined className={styles.profileChevron} />
          </Button>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <AntdRegistry>
      <ConfigProvider
        locale={idID}
        theme={{
          token: {
            colorPrimary: "#FCB040",
            colorBgLayout: "#FFF8EE",
            colorText: "#3A2313",
            colorTextSecondary: "#765D48",
            colorBorder: "#EBD9BE",
            colorPrimaryHover: "#E99B22",
            colorSuccess: "#267044",
            colorWarning: "#9A5A00",
            colorError: "#B84438",
            borderRadius: 8,
            controlHeight: 36,
            fontFamily: "var(--font-geist-sans), Arial, sans-serif",
          },
        }}
      >
        <AntdApp>
          <DesignerTemplatesProvider>
            <Layout className={`${styles.workspace} min-h-screen`}>
            <Sider
              width={224}
              collapsed={isMainSidebarCollapsed}
              collapsedWidth={0}
              theme="light"
              trigger={null}
              className={`${styles.mainSidebar} border-r border-[#EBD9BE] transition-[width] duration-200`}
            >
              {sidebarNavigation}
            </Sider>
            <Layout className="min-w-0">
              <Header
                className={`${styles.designerHeader} flex items-center border-b border-[#EBD9BE]`}
              >
                <Space size={8}>
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    aria-label="Buka navigasi"
                    className={styles.headerMenuButton}
                    onClick={() => setIsMobileMenuOpen(true)}
                  />
                  <Tooltip
                    title={
                      isMainSidebarCollapsed
                        ? "Show navigation"
                        : "Hide navigation"
                    }
                  >
                    <Button
                      type="text"
                      icon={
                        isMainSidebarCollapsed ? (
                          <MenuUnfoldOutlined />
                        ) : (
                          <MenuFoldOutlined />
                        )
                      }
                      aria-label={
                        isMainSidebarCollapsed
                          ? "Show navigation"
                          : "Hide navigation"
                      }
                      aria-expanded={!isMainSidebarCollapsed}
                      className={styles.headerSidebarToggle}
                      onClick={() =>
                        setIsMainSidebarCollapsed((collapsed) => !collapsed)
                      }
                    />
                  </Tooltip>
                  <div className="hidden sm:block">
                    <Breadcrumb
                      items={[
                        { title: "Designer" },
                        { title: breadcrumbTitle },
                      ]}
                    />
                  </div>
                  <Text strong className="sm:!hidden">
                    InviteU Studio
                  </Text>
                </Space>
              </Header>
              <Content className={`${styles.designerContent} min-w-0`}>
                <div className={styles.pageContent}>{children}</div>
              </Content>
            </Layout>
            <Drawer
              title="InviteU Studio"
              placement="left"
              size={280}
              open={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              className={styles.mobileNavigationDrawer}
              styles={{
                header: { background: "#3A2313", borderColor: "#765D48" },
                body: { display: "flex", padding: 0 },
              }}
            >
              {sidebarNavigation}
            </Drawer>
            </Layout>
          </DesignerTemplatesProvider>
        </AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
