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
```

## 중요한 설계 메모

Vercel 서버리스 함수에서 학생의 임의 파이썬 코드를 직접 실행하지 않습니다. 실제 운영 채점기는 Judge0, Piston, Docker 기반 샌드박스, 별도 채점 서버 중 하나로 분리하는 것이 안전합니다. 현재 구현은 초급 예시 문제를 체험할 수 있는 교체형 판정 모듈을 사용합니다.
