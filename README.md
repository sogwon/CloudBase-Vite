# CloudBase + Vite 웹앱

Tencent CloudBase를 사용하는 React(Vite) 웹앱입니다. CloudBase에 연결한 뒤 MySQL 테이블 목록을 조회하고, 테이블 데이터를 미리볼 수 있습니다.

## 빠른 시작 (Clone 후)

```bash
git clone https://github.com/<사용자명>/CloudBase-Vite.git
cd CloudBase-Vite
cp .env.example .env   # .env에 환경 변수 입력
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속하세요.

## 사전 요구사항

1. **보안 도메인 설정 (CORS 해결 필수)**  
   CloudBase 콘솔 → [환경 설정 / 보안 설정](https://tcb.cloud.tencent.com/dev#/env/safety-source)에서  
   **添加域名**으로 다음을 추가하세요.
   - `localhost:5173` (Vite 기본 포트)
   - 필요 시 `127.0.0.1:5173`  
   ⚠️ `http://` 는 붙이지 말고 `localhost:5173` 형식만 입력합니다.  
   설정 후 약 1~10분 후 적용되며, CORS 오류는 이 설정 후 해결됩니다.

2. **환경 변수**  
   `.env.example`을 참고해 `.env` 파일을 만들고 다음 값을 채우세요.
   - `VITE_CLOUDBASE_ENV_ID`: 환경 ID
   - `VITE_CLOUDBASE_REGION`: 리전 (예: `ap-singapore`)
   - `VITE_CLOUDBASE_ACCESS_KEY`: Publishable Key (API 키 설정에서 발급)

## 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` (또는 터미널에 표시된 주소)로 접속하세요.

## MySQL 테이블 목록 조회

MySQL 테이블 목록은 **서버 전용 API**이므로 웹 클라이언트에서는 Cloud Function을 통해 조회합니다.

1. **Cloud Function 배포**  
   `cloudfunctions/getTableList` 폴더를 CloudBase 콘솔의 **云函数**에 업로드합니다.
   - 함수 이름: `getTableList`
   - CloudBase 온라인 편집기에서 해당 함수를 만든 뒤, `index.js`와 `package.json` 내용을 이 프로젝트와 동일하게 넣고  
     **「保存并安装依赖」**를 실행해 배포하세요.
   - MySQL형 데이터베이스가 해당 환경에 연결되어 있어야 합니다.

2. **웹앱에서 조회**  
   앱에서 **「연결 확인」** 후 **「테이블 목록 조회」** 버튼을 누르면, 배포한 `getTableList` Cloud Function이 호출되고 MySQL 테이블 목록이 표시됩니다.

3. **테이블 데이터 미리보기**  
   `cloudfunctions/getTableData` Cloud Function을 같은 방식으로 배포하면, 테이블 목록에서 **테이블명을 클릭**했을 때 해당 테이블의 샘플 데이터(최대 20행)가 표시됩니다.

## 프로젝트 구조

- `src/cloudbase.js` — CloudBase JS SDK 초기화
- `src/App.jsx` — 연결 확인, 테이블 목록 조회, 테이블 데이터 미리보기 UI
- `cloudfunctions/getTableList/` — MySQL 테이블 목록 조회용 Cloud Function
- `cloudfunctions/getTableData/` — 선택한 테이블의 샘플 데이터 조회용 Cloud Function

## GitHub에 업로드하기

1. [GitHub](https://github.com/new)에서 **New repository** 생성 (저장소 이름 예: `CloudBase-Vite`)
2. 터미널에서 아래 실행 (`YOUR_USERNAME`과 `CloudBase-Vite`를 본인 저장소로 변경):

```bash
cd /Users/pumila-1/Cursor/CloudBase-Vite
git remote add origin https://github.com/YOUR_USERNAME/CloudBase-Vite.git
git branch -M main
git push -u origin main
```

GitHub CLI를 쓰는 경우:

```bash
cd /Users/pumila-1/Cursor/CloudBase-Vite
gh repo create CloudBase-Vite --private --source=. --remote=origin --push
```

## 참고

- [CloudBase JS SDK V2 초기화](https://docs.cloudbase.net/en/api-reference/webv2/initialization)
- [CloudBase Cloud Function 작성](https://docs.cloudbase.net/en/cloud-function/how-coding)
