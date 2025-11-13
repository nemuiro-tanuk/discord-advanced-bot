#!/bin/bash

# ディレクトリ構造を作成
mkdir -p src/{config,commands/{music,moderation,economy,ai,voice,game,utility},events,handlers,modules/{music,tts,ai,economy,auth,recruitment,voice,scheduler,moderation,ticket,giveaway,game,translation,image},database/models,utils}
mkdir -p tests docs

echo "ディレクトリ構造を作成しました"
