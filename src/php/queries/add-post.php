<?php
  class AddPost extends Query{
    public function query($pdo, $args){
      $st = $pdo->prepare('
        select idUser as id, isMod
        from User where token = ?
      ');
      $st->execute([$args->token]);
      $row = $st->fetch();

      if($row === false){
        $this->err('data');
        return;
      }

      if($row['isMod'] === 0){
        $this->err('forbidden');
        return;
      }

      $pdo->prepare('
        insert into Post (
          postedBy,
          content,
          creationDate
        ) values (?, ?, ?)
      ')->execute([$row['id'], $args->content, $this->date]);
      $this->succ();
    }
  }

  new AddPost();
?>