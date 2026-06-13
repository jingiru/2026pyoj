# 2026pyoj
파이썬 수업용 OJ

## 개요

PyOJ Classroom은 중학생 파이썬 초급 수업을 위한 Online Judge 기반 학습 플랫폼입니다.

- 학생: 학번 4자리와 이름으로 로그인, 문제 풀이, 코드 제출, 결과 확인
- 교사: 제출 기록 확인, 학급 대시보드, 문제 생성 흐름 확인
- DB: Supabase PostgreSQL
- 배포: Vercel

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`으로 접속합니다.

Supabase 환경변수가 없으면 브라우저 저장소를 사용해 데모 모드로 동작합니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. Vercel 또는 로컬 `.env.local`에 아래 값을 등록합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
TEACHER_PASSWORD=...
SUPABASE_SERVICE_ROLE_KEY=...
```

최신 Supabase 프로젝트에서 publishable key를 제공하는 경우
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 대신 사용할 수 있습니다. 환경변수를 변경한 뒤에는
Vercel에서 새로 배포해야 클라이언트 번들에 값이 반영됩니다.

`TEACHER_PASSWORD`와 `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 값입니다. 두 값에는
`NEXT_PUBLIC_` 접두사를 붙이지 마세요. 기존 Supabase 프로젝트는 SQL Editor에서
`supabase/teacher_dashboard_security.sql`을 한 번 실행해 브라우저 anon 사용자의 제출 기록
조회 권한을 제거합니다. 교사 대시보드는 인증된 서버 API가 service role로 조회합니다.

처음 설치하거나 문제 테이블이 비어 있는 프로젝트는 Supabase SQL Editor에서
`supabase/seed_current_curriculum.sql`을 실행해 현재 앱의 문제집, 문제, 테스트케이스를
등록해야 합니다. `submissions.problem_id`는 `problems.id`를 참조하므로 문제 데이터가 없으면
학생 제출 저장이 외래키 오류로 거부됩니다.

기존 DB에서 문제 일괄 업로드를 사용하기 전에는 SQL Editor에서
`supabase/problem_bulk_import_migration.sql`을 한 번 실행하세요. 이 SQL은 사용하지 않는
`problems.unit`, `problems.level` 컬럼을 삭제하고, 모범답안 저장 구조를 준비하며, 기존 영문
ID 제약조건을 제거한 뒤 문제집 ID를 `01 출력 함수 기초`와 같은 업로드 서식의 한글 ID로
이전합니다.

교사 화면의 문제 관리 영역에서는 XLSX 서식을 내려받고 문제를 일괄 업로드할 수 있습니다.
동일한 문제ID는 수정되고 새로운 문제ID는 추가되며, 완료 후 DB에서 문제·테스트케이스·모범답안
수를 다시 확인한 결과가 팝업으로 표시됩니다.

로그인 오류에 `42P01`, `42501`, `42703` 같은 코드가 표시되면 각각 테이블 없음, RLS/권한
문제, 컬럼 불일치를 뜻합니다. 브라우저 개발자 도구 콘솔에는 Supabase의 상세 오류도 기록됩니다.

## 중요한 설계 메모

Vercel 서버리스 함수에서 학생의 임의 파이썬 코드를 직접 실행하지 않습니다. 실제 운영 채점기는 Judge0, Piston, Docker 기반 샌드박스, 별도 채점 서버 중 하나로 분리하는 것이 안전합니다. 현재 구현은 초급 예시 문제를 체험할 수 있는 교체형 판정 모듈을 사용합니다.
