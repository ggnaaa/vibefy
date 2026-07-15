# Vibefy — Hugging Face Spaces (Docker)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG VITE_AUDIUS_API_KEY
ARG VITE_JAMENDO_CLIENT_ID
ENV VITE_AUDIUS_API_KEY=$VITE_AUDIUS_API_KEY
ENV VITE_JAMENDO_CLIENT_ID=$VITE_JAMENDO_CLIENT_ID

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# Runtime secrets (set in HF Space settings): HF_TOKEN, GROQ_API_KEY
EXPOSE 7860
CMD ["node", "dist-server/index.js"]
