find exports -type f -name "*.json" | while read file; do 
  case $file in 
    *.json)
    npx -y prettier $file > "$file-copy"
    mv -f "$file-copy" $file
  esac
done
