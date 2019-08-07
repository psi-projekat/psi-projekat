<?php
  class GetFunctionalities extends Query{
    public function query($pdo, $args){
      if($args->token === null){
        $st = $pdo->prepare('
          select idFunc as id, name, description as `desc`, points, 0 as upgraded
          from Functionality
          where instr(description, ?) > 0
        ');
        $st->execute([$args->keywords]);
        $this->succ($st->fetchAll());
        return;
      }

      $st = $pdo->prepare('
        select idUser from User
        where token = ?
      ');
      $st->execute([$args->token]);
      $id = $st->fetchColumn();

      if($id === false){
        $this->err('data');
        return;
      }

      $st = $pdo->prepare('
        select idFunc as id, name, description as `desc`, points, (
          select count(*) from Upgrade
          where user = ? and func = idFunc
        ) as upgraded
        from Functionality
        where instr(description, ?) > 0
      ');
      $st->execute([$id, $args->keywords]);
      $this->succ($st->fetchAll());
    }
  }

  new GetFunctionalities();
?>