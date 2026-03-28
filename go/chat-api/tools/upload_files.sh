curl -X POST http://localhost:8080/upload \
  -F "files=@./test_1.txt" \
  -F "files=@./test_2.txt" \
  -H "Content-Type: multipart/form-data"