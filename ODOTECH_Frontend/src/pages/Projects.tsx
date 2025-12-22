import { useMemo, useState } from 'react';

import ConfirmDeleteModal from '../components/accountsDasboard/ConfirmDeleteModal';

import ProjectDetailsPanel from '../components/projectsDasboard/ProjectDetailsPanel';
import ProjectEditModal from '../components/projectsDasboard/ProjectEditModal';
import ProjectsDashboard from '../components/projectsDasboard/ProjectsDashboard';
import ProjectsTable from '../components/projectsDasboard/ProjectsTable';
import ProjectsToolbar from '../components/projectsDasboard/ProjectsToolbar';
import { nextProjectId } from '../components/projectsDasboard/projectUtils';
import type { ProjectItem } from '../types/Interface';

const sampleProjects: ProjectItem[] = [
  {
    id: 3001,
    tenDuAn: 'Triển khai ERP',
    moTa: 'Triển khai các phân hệ kế toán, kho và mua hàng.',
    khachHang: 'Công ty ABC',
    ngayBatDau: '2025-11-20',
    ngayKetThuc: '2026-02-15',
    mucDoUuTien: 'high',
    pm: 'Trần Văn B',
    trangThai: 'in_progress',
    tienDo: 35,
    soTask: 42,
    taskQuaHan: 5,
    thanhVien: ['Lê Thị C', 'Nguyễn Văn A', 'Trần Văn B'],
    taiLieu: ['Scope_ERP_v1.docx', 'Plan_ERP.xlsx'],
    ghiChu: 'Ưu tiên hoàn thiện phân hệ kế toán trước.',
  },
  {
    id: 3002,
    tenDuAn: 'Nâng cấp CRM',
    moTa: 'Chuẩn hóa quy trình sales, cấu hình pipeline và báo cáo.',
    khachHang: 'Công ty XYZ',
    ngayBatDau: '2025-12-10',
    ngayKetThuc: '2026-01-20',
    mucDoUuTien: 'medium',
    pm: 'Nguyễn Văn A',
    trangThai: 'not_started',
    tienDo: 0,
    soTask: 18,
    taskQuaHan: 0,
    thanhVien: ['Nguyễn Văn A'],
    taiLieu: [],
    ghiChu: 'Chờ xác nhận yêu cầu báo cáo từ khách hàng.',
  },
  {
    id: 3003,
    tenDuAn: 'Tích hợp HRM',
    moTa: 'Tạm dừng chờ khách hàng bổ sung dữ liệu nhân sự.',
    khachHang: 'Công ty MNO',
    ngayBatDau: '2025-10-05',
    ngayKetThuc: '2025-12-30',
    mucDoUuTien: 'high',
    pm: 'Lê Thị C',
    trangThai: 'on_hold',
    tienDo: 20,
    soTask: 25,
    taskQuaHan: 2,
    thanhVien: ['Lê Thị C', 'Trần Văn B'],
    taiLieu: ['HR_Data_Checklist.pdf'],
    ghiChu: 'Đang chờ dữ liệu nhân sự (file master).',
  },
  {
    id: 3004,
    tenDuAn: 'Cổng báo cáo BI',
    moTa: 'Hoàn thành dashboard tổng hợp KPI theo phòng ban.',
    khachHang: 'Công ty QRS',
    ngayBatDau: '2025-08-01',
    ngayKetThuc: '2025-10-15',
    mucDoUuTien: 'low',
    pm: 'Trần Văn B',
    trangThai: 'completed',
    tienDo: 100,
    soTask: 12,
    taskQuaHan: 0,
    thanhVien: ['Trần Văn B', 'Nguyễn Văn A'],
    taiLieu: ['BI_Final_Export.zip'],
    ghiChu: 'Đã bàn giao và nghiệm thu.',
  },
];

export default function Projects() {
  const [projects, setProjects] = useState<ProjectItem[]>(sampleProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<ProjectItem | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((item) => {
      return (
        String(item.id).includes(term) ||
        item.tenDuAn.toLowerCase().includes(term) ||
        item.khachHang.toLowerCase().includes(term) ||
        item.pm.toLowerCase().includes(term)
      );
    });
  }, [projects, searchTerm]);

  const selectedProject = useMemo(() => {
    if (!selectedId) return null;
    return projects.find((p) => p.id === selectedId) ?? null;
  }, [projects, selectedId]);

  return (
    <main className="flex-1 p-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-5">Quản lý dự án</h1>

        <ProjectsDashboard projects={projects} today={today} />

        <ProjectsToolbar
          searchTerm={searchTerm}
          onChangeSearchTerm={setSearchTerm}
          filteredCount={filteredProjects.length}
          onCreate={() => {
            const id = nextProjectId(projects);
            const draft: ProjectItem = {
              id,
              tenDuAn: '',
              moTa: '',
              khachHang: '',
              ngayBatDau: '',
              ngayKetThuc: '',
              mucDoUuTien: 'medium',
              pm: '',
              trangThai: 'not_started',
              tienDo: 0,
              soTask: 0,
              taskQuaHan: 0,
              thanhVien: [],
              taiLieu: [],
              ghiChu: '',
            };
            setEditDraft(draft);
            setEditOpen(true);
          }}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProjectsTable
            projects={filteredProjects}
            selectedId={selectedId}
            today={today}
            onSelect={(id) => setSelectedId(id)}
            onEdit={(project) => {
              setEditDraft(project);
              setEditOpen(true);
            }}
            onDelete={(id) => {
              setDeleteTargetId(id);
              setDeleteOpen(true);
            }}
          />

          <ProjectDetailsPanel project={selectedProject} today={today} />
        </div>
      </div>

      <ProjectEditModal
        open={editOpen}
        draft={editDraft}
        onChangeDraft={(next) => setEditDraft(next)}
        onClose={() => {
          setEditOpen(false);
          setEditDraft(null);
        }}
        onSave={() => {
          if (!editDraft) return;
          setProjects((prev) => {
            const exists = prev.some((p) => p.id === editDraft.id);
            if (exists) return prev.map((p) => (p.id === editDraft.id ? editDraft : p));
            return [editDraft, ...prev];
          });
          setSelectedId(editDraft.id);
          setEditOpen(false);
          setEditDraft(null);
        }}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Xác nhận xóa dự án"
        description={deleteTargetId ? `Bạn có chắc chắn muốn xóa dự án #${deleteTargetId} không?` : 'Bạn có chắc chắn muốn xóa dự án này không?'}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId) return;
          setProjects((prev) => prev.filter((p) => p.id !== deleteTargetId));
          setSelectedId((prev) => (prev === deleteTargetId ? null : prev));
          setDeleteOpen(false);
          setDeleteTargetId(null);
        }}
      />
    </main>
  );
}
