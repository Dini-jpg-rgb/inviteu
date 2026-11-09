"use client";

import React, { useState } from "react";
import {
  CheckCircleOutlined,
  GlobalOutlined,
  MailOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Typography,
} from "antd";
import { useUserManagement } from "@/context/UserManagementContext";
import { DesignerPageHeader } from "../components/DesignerPageHeader";
import { DesignerStatusTag } from "../components/DesignerStatusTag";
import styles from "../../designer-workspace.module.css";

const { Text } = Typography;

interface DesignerProfileValues {
  name: string;
  email: string;
  specialization: string;
  portfolio: string;
}

export default function DesignerProfilePage() {
  const { getDesignerStatus } = useUserManagement();
  const currentStatus = getDesignerStatus("designer@inviteu.id");
  const isAccountActive = currentStatus === "active";
  const [form] = Form.useForm<DesignerProfileValues>();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
  };

  return (
    <div className={styles.profileContent}>
      <DesignerPageHeader
        title="Profile"
        description="Informasi akun dan profil kreatif Designer."
      />

      <Card className="mb-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar size={56} icon={<UserOutlined />} className="!bg-[#FDEBD3] !text-[#9A5A00]" />
          <div className="min-w-0 flex-1">
            <Typography.Title level={4} className="!mb-1">
              Rian Creative Lead
            </Typography.Title>
            <Text type="secondary">Designer · InviteU Studio</Text>
          </div>
          <div className="flex items-center gap-2">
            <DesignerStatusTag status={isAccountActive ? "active" : "inactive"} />
            <Text type="secondary" className="text-xs">
              {isAccountActive ? "Akun aktif" : "Akun nonaktif"}
            </Text>
          </div>
        </div>
      </Card>

      {!isAccountActive && (
        <Alert
          className="mb-5"
          type="warning"
          showIcon
          title="Akun Designer dinonaktifkan"
          description="Pengajuan template baru sementara dibatasi. Hubungi administrator untuk informasi lebih lanjut."
        />
      )}

      {saveSuccess && (
        <Alert
          className="mb-5"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          title="Perubahan diterapkan sementara"
          description="Profil ini menggunakan data lokal; perubahan tidak dikirim atau disimpan ke backend."
          closable
          onClose={() => setSaveSuccess(false)}
        />
      )}

      <Card title="Informasi profil">
        <Form<DesignerProfileValues>
          form={form}
          layout="vertical"
          initialValues={{
            name: "Rian Creative Lead",
            email: "designer@inviteu.id",
            specialization: "Wedding Luxury & Typography",
            portfolio: "https://behance.net/rian-inviteu",
          }}
          onFinish={handleSave}
          onValuesChange={() => setSaveSuccess(false)}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nama lengkap"
                name="name"
                rules={[{ required: true, message: "Nama wajib diisi." }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nama Designer" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email akun" name="email">
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Spesialisasi desain"
                name="specialization"
                rules={[
                  { required: true, message: "Spesialisasi wajib diisi." },
                ]}
              >
                <Input placeholder="Contoh: Wedding Luxury" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tautan portofolio"
                name="portfolio"
                rules={[
                  { type: "url", warningOnly: true, message: "Periksa format URL." },
                ]}
              >
                <Input prefix={<GlobalOutlined />} placeholder="https://" />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end border-t border-[#EBD9BE] pt-4">
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Simpan perubahan
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
